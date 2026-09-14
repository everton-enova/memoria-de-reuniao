export const TIME_ZONE = "America/Sao_Paulo";

export type ProcessingStatus =
  | "draft"
  | "uploaded"
  | "transcribing"
  | "organizing"
  | "completed"
  | "failed";

/** Estados em que o processamento foi iniciado mas ainda não terminou. */
const IN_FLIGHT: ProcessingStatus[] = ["uploaded", "transcribing", "organizing"];

/** Depois disso, um processamento em andamento é considerado interrompido e pode ser retomado. */
export const STALE_PROCESSING_MS = 5 * 60 * 1000;

export function isInFlight(status: ProcessingStatus) {
  return IN_FLIGHT.includes(status);
}

/** Um processamento que travou (aba fechada, timeout da função) e precisa ser retomado. */
export function isStalled(status: ProcessingStatus, updatedAt: string | null) {
  if (!isInFlight(status)) return false;
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > STALE_PROCESSING_MS;
}

export function statusLabel(status: ProcessingStatus, updatedAt: string | null = null) {
  if (status === "completed") return "Concluída";
  if (status === "failed") return "Falha no processamento";
  if (isStalled(status, updatedAt)) return "Processamento interrompido";
  if (status === "draft") return "Rascunho";
  if (status === "uploaded") return "Na fila";
  if (status === "transcribing") return "Transcrevendo";
  return "Organizando a memória";
}

export function formatMinutes(totalMinutes: number) {
  if (totalMinutes <= 0) return "0min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}min`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

/** "04 set", para o selo de data das reuniões. */
export function formatDayMonth(iso: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: TIME_ZONE,
  }).formatToParts(new Date(iso));
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value.replace(".", "") ?? "";
  return `${day} ${month}`;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatDueDate(dueDate: string) {
  const today = dayKey(new Date());
  if (dueDate === today) return "Hoje";
  if (dueDate === dayKey(new Date(Date.now() + 86_400_000))) return "Amanhã";
  return formatDayMonth(`${dueDate}T12:00:00`);
}

export function isDueToday(dueDate: string | null) {
  return Boolean(dueDate) && dueDate === dayKey(new Date());
}

export function isOverdue(dueDate: string | null) {
  return Boolean(dueDate) && dueDate! < dayKey(new Date());
}

/** Data no formato AAAA-MM-DD no fuso do usuário, comparável com uma coluna `date`. */
function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}
