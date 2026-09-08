import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Memory = {
  summary: string;
  decisions: string[];
  action_items: Array<{ content: string; assignee: string | null; due_date: string | null }>;
};

function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Falha inesperada no processamento.";
}

async function createMemory(transcript: string): Promise<Memory> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      reasoning_effort: "low",
      messages: [
        { role: "system", content: "Você organiza memórias de reunião para um órgão público brasileiro. Não invente fatos. Extraia apenas decisões e encaminhamentos explícitos. Datas desconhecidas devem ser null." },
        { role: "user", content: `Gere uma memória objetiva em português para a transcrição abaixo.\n\n${transcript.slice(0, 100000)}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meeting_memory",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              decisions: { type: "array", items: { type: "string" } },
              action_items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: { content: { type: "string" }, assignee: { type: ["string", "null"] }, due_date: { type: ["string", "null"] } },
                  required: ["content", "assignee", "due_date"],
                },
              },
            },
            required: ["summary", "decisions", "action_items"],
          },
        },
      },
    }),
  });
  if (!response.ok) throw new Error("Não foi possível organizar a memória com a IA.");
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("A IA não retornou uma memória válida.");
  return JSON.parse(content) as Memory;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.info("[meeting-process] request received", { meetingId: id });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "A integração Groq não está configurada." }, { status: 503 });

  const { data: meeting } = await supabase.from("meetings").select("id,audio_path,audio_mime_type,title").eq("id", id).single();
  if (!meeting?.audio_path) return NextResponse.json({ error: "Áudio não encontrado." }, { status: 404 });

  try {
    console.info("[meeting-process] starting transcription", { meetingId: id });
    await supabase.from("meetings").update({ processing_status: "transcribing", processing_error: null }).eq("id", id);
    const { data: audio, error: downloadError } = await supabase.storage.from("meeting-audios").download(meeting.audio_path);
    if (downloadError || !audio) throw new Error("Não foi possível acessar o áudio privado.");
    if (audio.size > 25 * 1024 * 1024) throw new Error("O áudio excede o limite de 25 MB para transcrição.");

    const fileName = meeting.audio_path.split("/").pop() || "reuniao.webm";
    const form = new FormData();
    form.append("file", audio, fileName);
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", "pt");
    form.append("response_format", "json");
    form.append("prompt", "Reunião institucional em português do Brasil. Preserve nomes próprios e siglas quando forem claros.");
    const transcriptionResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form });
    if (!transcriptionResponse.ok) throw new Error("A Groq não conseguiu transcrever este áudio.");
    const transcription = await transcriptionResponse.json() as { text?: string };
    if (!transcription.text?.trim()) throw new Error("Nenhuma fala foi identificada no áudio.");

    await supabase.from("meetings").update({ transcript: transcription.text, processing_status: "organizing" }).eq("id", id);
    console.info("[meeting-process] transcription completed", { meetingId: id, characters: transcription.text.length });
    let memory: Memory = { summary: "Transcrição concluída. A organização automática não foi disponibilizada.", decisions: [], action_items: [] };
    try { memory = await createMemory(transcription.text); } catch { /* A transcrição continua disponível mesmo se o resumo falhar. */ }

    await supabase.from("meetings").update({ summary: memory.summary, status: "completed", processing_status: "completed", processing_error: null }).eq("id", id);
    if (memory.decisions.length) await supabase.from("decisions").insert(memory.decisions.map((content) => ({ meeting_id: id, content })));
    if (memory.action_items.length) await supabase.from("action_items").insert(memory.action_items.map((item) => ({ meeting_id: id, ...item })));
    console.info("[meeting-process] memory completed", { meetingId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[meeting-process] failed", { meetingId: id, error: safeError(error) });
    await supabase.from("meetings").update({ processing_status: "failed", processing_error: safeError(error) }).eq("id", id);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}
