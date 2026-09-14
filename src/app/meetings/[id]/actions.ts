"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EditResult = { error?: string };

/** Campos da reunião que o usuário pode corrigir depois da geração automática. */
const TEXT_COLUMNS = new Set(["title", "summary", "transcript"]);
const NOTE_TEXT_FIELDS = new Set(["objective"]);
const NOTE_LIST_FIELDS = new Set(["main_points", "validation_points"]);

type MeetingNotes = { objective?: string; main_points?: string[]; validation_points?: string[] };

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

function refresh(meetingId: string) {
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/");
}

function linesFrom(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

/** Atualiza um campo de texto da reunião ou um dos campos guardados em `notes`. */
export async function updateMeetingField(_prev: EditResult, formData: FormData): Promise<EditResult> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "");
  if (!meetingId) return { error: "Reunião não identificada." };

  const supabase = await authenticatedClient();
  if (!supabase) return { error: "Sessão expirada. Entre novamente." };

  if (TEXT_COLUMNS.has(field)) {
    const trimmed = value.trim();
    if (field === "title" && (trimmed.length < 2 || trimmed.length > 160)) {
      return { error: "O assunto deve ter entre 2 e 160 caracteres." };
    }
    const { error } = await supabase.from("meetings").update({ [field]: trimmed || null }).eq("id", meetingId);
    if (error) return { error: error.message };
    refresh(meetingId);
    return {};
  }

  if (NOTE_TEXT_FIELDS.has(field) || NOTE_LIST_FIELDS.has(field)) {
    const { data: meeting } = await supabase.from("meetings").select("notes").eq("id", meetingId).single();
    if (!meeting) return { error: "Reunião não encontrada." };

    let notes: MeetingNotes = {};
    try { notes = meeting.notes ? JSON.parse(meeting.notes) as MeetingNotes : {}; } catch { notes = {}; }
    const updated = NOTE_LIST_FIELDS.has(field)
      ? { ...notes, [field]: linesFrom(value) }
      : { ...notes, [field]: value.trim() };

    const { error } = await supabase.from("meetings").update({ notes: JSON.stringify(updated) }).eq("id", meetingId);
    if (error) return { error: error.message };
    refresh(meetingId);
    return {};
  }

  return { error: "Campo não editável." };
}

export async function addDecision(_prev: EditResult, formData: FormData): Promise<EditResult> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "Escreva a decisão antes de adicionar." };

  const supabase = await authenticatedClient();
  if (!supabase) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("decisions").insert({ meeting_id: meetingId, content });
  if (error) return { error: error.message };
  refresh(meetingId);
  return {};
}

export async function updateDecision(_prev: EditResult, formData: FormData): Promise<EditResult> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const id = String(formData.get("id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "A decisão não pode ficar vazia." };

  const supabase = await authenticatedClient();
  if (!supabase) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("decisions").update({ content }).eq("id", id);
  if (error) return { error: error.message };
  refresh(meetingId);
  return {};
}

export async function deleteDecision(formData: FormData) {
  const meetingId = String(formData.get("meetingId") ?? "");
  const id = String(formData.get("id") ?? "");
  const supabase = await authenticatedClient();
  if (!supabase) return;
  await supabase.from("decisions").delete().eq("id", id);
  refresh(meetingId);
}

export async function addParticipant(_prev: EditResult, formData: FormData): Promise<EditResult> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const name = String(formData.get("content") ?? "").trim();
  if (!name) return { error: "Informe o nome do participante." };

  const supabase = await authenticatedClient();
  if (!supabase) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("participants").insert({ meeting_id: meetingId, name });
  if (error) return { error: error.message };
  refresh(meetingId);
  return {};
}

export async function updateParticipant(_prev: EditResult, formData: FormData): Promise<EditResult> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("content") ?? "").trim();
  if (!name) return { error: "O nome não pode ficar vazio." };

  const supabase = await authenticatedClient();
  if (!supabase) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("participants").update({ name }).eq("id", id);
  if (error) return { error: error.message };
  refresh(meetingId);
  return {};
}

export async function deleteParticipant(formData: FormData) {
  const meetingId = String(formData.get("meetingId") ?? "");
  const id = String(formData.get("id") ?? "");
  const supabase = await authenticatedClient();
  if (!supabase) return;
  await supabase.from("participants").delete().eq("id", id);
  refresh(meetingId);
}

function actionItemFields(formData: FormData) {
  const dueDate = String(formData.get("due_date") ?? "").trim();
  return {
    content: String(formData.get("content") ?? "").trim(),
    assignee: String(formData.get("assignee") ?? "").trim() || null,
    due_date: dueDate || null,
  };
}

export async function addActionItem(_prev: EditResult, formData: FormData): Promise<EditResult> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const fields = actionItemFields(formData);
  if (!fields.content) return { error: "Escreva o encaminhamento antes de adicionar." };

  const supabase = await authenticatedClient();
  if (!supabase) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("action_items").insert({ meeting_id: meetingId, ...fields });
  if (error) return { error: error.message };
  refresh(meetingId);
  return {};
}

export async function updateActionItem(_prev: EditResult, formData: FormData): Promise<EditResult> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const id = String(formData.get("id") ?? "");
  const fields = actionItemFields(formData);
  if (!fields.content) return { error: "O encaminhamento não pode ficar vazio." };

  const supabase = await authenticatedClient();
  if (!supabase) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("action_items").update(fields).eq("id", id);
  if (error) return { error: error.message };
  refresh(meetingId);
  return {};
}

export async function deleteActionItem(formData: FormData) {
  const meetingId = String(formData.get("meetingId") ?? "");
  const id = String(formData.get("id") ?? "");
  const supabase = await authenticatedClient();
  if (!supabase) return;
  await supabase.from("action_items").delete().eq("id", id);
  refresh(meetingId);
}

export async function setActionItemCompleted(formData: FormData) {
  const meetingId = String(formData.get("meetingId") ?? "");
  const id = String(formData.get("id") ?? "");
  const completed = String(formData.get("completed") ?? "") === "true";
  const supabase = await authenticatedClient();
  if (!supabase) return;
  await supabase.from("action_items").update({ completed: !completed }).eq("id", id);
  refresh(meetingId);
}
