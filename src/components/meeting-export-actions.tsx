"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportMeeting = { title: string; occurredAt: string; durationMinutes: number | null; participants: string[]; objective: string; mainPoints: string[]; summary: string | null; decisions: string[]; actionItems: Array<{ content: string; assignee: string | null; dueDate: string | null }>; validationPoints: string[] };

function list(items: string[]) { return items.length ? items.map((item) => `- ${item}`).join("\n") : "- Não identificado."; }

export function MeetingExportActions({ meeting }: { meeting: ExportMeeting }) {
  function downloadMarkdown() {
    const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(meeting.occurredAt));
    const markdown = `# MEMÓRIA EXECUTIVA DA REUNIÃO\n\n## ${meeting.title}\n\n**Data:** ${date}${meeting.durationMinutes ? `  \n**Duração:** ${meeting.durationMinutes} min` : ""}\n\n## Participantes\n${list(meeting.participants)}\n\n## Objetivo e pauta\n${meeting.objective}\n\n## Principais pontos discutidos\n${list(meeting.mainPoints)}\n\n## Síntese executiva\n${meeting.summary ?? "Não identificada."}\n\n## Decisões e alinhamentos\n${list(meeting.decisions)}\n\n## Encaminhamentos\n${list(meeting.actionItems.map((item) => `${item.content}${item.assignee ? ` — Responsável: ${item.assignee}` : ""}${item.dueDate ? ` — Prazo: ${item.dueDate}` : ""}`))}\n\n## Pontos que ainda precisam de validação\n${list(meeting.validationPoints)}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${meeting.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "memoria-reuniao"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="flex flex-wrap gap-2 print:hidden"><Button onClick={downloadMarkdown} variant="outline" size="sm"><Download /> Baixar Markdown</Button><Button onClick={() => window.print()} variant="outline" size="sm"><Printer /> Imprimir / salvar PDF</Button></div>;
}
