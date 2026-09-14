import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STALE_PROCESSING_MS } from "@/lib/meetings";
import { MAX_AUDIO_BYTES, MAX_AUDIO_MB } from "@/lib/audio";

export const runtime = "nodejs";
export const maxDuration = 60;

type Memory = {
  summary: string;
  objective: string;
  main_points: string[];
  validation_points: string[];
  participants: string[];
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
        { role: "system", content: "Você organiza memórias executivas de reunião para um órgão público brasileiro. Não invente fatos. Extraia apenas participantes, decisões e encaminhamentos explícitos. Datas desconhecidas devem ser null. O resumo deve ser objetivo, formal e pronto para registro institucional." },
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
              objective: { type: "string" },
              main_points: { type: "array", items: { type: "string" } },
              validation_points: { type: "array", items: { type: "string" } },
              participants: { type: "array", items: { type: "string" } },
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
            required: ["summary", "objective", "main_points", "validation_points", "participants", "decisions", "action_items"],
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

/**
 * Substitui a memória anterior da reunião. Sem isso, reprocessar duplicaria
 * participantes, decisões e encaminhamentos a cada nova tentativa.
 */
async function replaceMemoryRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  meetingId: string,
  memory: Memory,
) {
  await Promise.all([
    supabase.from("participants").delete().eq("meeting_id", meetingId),
    supabase.from("decisions").delete().eq("meeting_id", meetingId),
    supabase.from("action_items").delete().eq("meeting_id", meetingId),
  ]);

  if (memory.participants.length) await supabase.from("participants").insert(memory.participants.map((name) => ({ meeting_id: meetingId, name })));
  if (memory.decisions.length) await supabase.from("decisions").insert(memory.decisions.map((content) => ({ meeting_id: meetingId, content })));
  if (memory.action_items.length) await supabase.from("action_items").insert(memory.action_items.map((item) => ({ meeting_id: meetingId, ...item })));
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

  // Reserva a reunião de forma atômica: só assume o processamento se ela não estiver
  // em andamento ou se a tentativa anterior tiver travado (aba fechada, timeout da função).
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();
  const { data: claimed } = await supabase
    .from("meetings")
    .update({ processing_status: "transcribing", processing_error: null })
    .eq("id", id)
    .or(`processing_status.in.(draft,uploaded,completed,failed),updated_at.lt.${staleBefore}`)
    .select("id");
  if (!claimed?.length) {
    console.info("[meeting-process] already running", { meetingId: id });
    return NextResponse.json({ error: "Esta reunião já está sendo processada. Aguarde a conclusão." }, { status: 409 });
  }

  try {
    console.info("[meeting-process] starting transcription", { meetingId: id });
    const { data: audio, error: downloadError } = await supabase.storage.from("meeting-audios").download(meeting.audio_path);
    if (downloadError || !audio) throw new Error("Não foi possível acessar o áudio privado.");
    if (audio.size > MAX_AUDIO_BYTES) throw new Error(`O áudio excede o limite de ${MAX_AUDIO_MB} MB para transcrição.`);

    const fileName = meeting.audio_path.split("/").pop() || "reuniao.webm";
    const form = new FormData();
    form.append("file", audio, fileName);
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", "pt");
    form.append("response_format", "verbose_json");
    form.append("prompt", "Reunião institucional em português do Brasil. Preserve nomes próprios e siglas quando forem claros.");
    const transcriptionResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form });
    if (!transcriptionResponse.ok) throw new Error("A Groq não conseguiu transcrever este áudio.");
    const transcription = await transcriptionResponse.json() as { text?: string; segments?: Array<{ end?: number }> };
    if (!transcription.text?.trim()) throw new Error("Nenhuma fala foi identificada no áudio.");

    await supabase.from("meetings").update({ transcript: transcription.text, processing_status: "organizing" }).eq("id", id);
    console.info("[meeting-process] transcription completed", { meetingId: id, characters: transcription.text.length });
    let memory: Memory = { summary: "Transcrição concluída. A organização automática não foi disponibilizada.", objective: "Não identificado automaticamente.", main_points: [], validation_points: [], participants: [], decisions: [], action_items: [] };
    try { memory = await createMemory(transcription.text); } catch { /* A transcrição continua disponível mesmo se o resumo falhar. */ }

    await replaceMemoryRows(supabase, id, memory);

    const durationSeconds = transcription.segments?.at(-1)?.end;
    await supabase.from("meetings").update({ summary: memory.summary, notes: JSON.stringify({ objective: memory.objective, main_points: memory.main_points, validation_points: memory.validation_points }), duration_minutes: durationSeconds ? Math.ceil(durationSeconds / 60) : null, status: "completed", processing_status: "completed", processing_error: null }).eq("id", id);
    console.info("[meeting-process] memory completed", { meetingId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[meeting-process] failed", { meetingId: id, error: safeError(error) });
    await supabase.from("meetings").update({ processing_status: "failed", processing_error: safeError(error) }).eq("id", id);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}
