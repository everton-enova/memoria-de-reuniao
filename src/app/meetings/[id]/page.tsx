import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, ListChecks } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingExportActions } from "@/components/meeting-export-actions";
import { MeetingProcessingPanel } from "@/components/meeting-processing-panel";
import { MeetingEditableField } from "@/components/meeting-editable-field";
import { MeetingListEditor } from "@/components/meeting-list-editor";
import { MeetingActionItemsEditor, type ActionItem } from "@/components/meeting-action-items-editor";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, statusLabel, type ProcessingStatus } from "@/lib/meetings";

type MeetingNotes = { objective?: string; main_points?: string[]; validation_points?: string[] };

function parseNotes(value: string | null): MeetingNotes {
  try { return value ? JSON.parse(value) as MeetingNotes : {}; } catch { return {}; }
}

export default async function MeetingPage({ params }: PageProps<"/meetings/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: meeting }, { data: participants }, { data: decisions }, { data: actions }] = await Promise.all([
    supabase.from("meetings").select("id,title,occurred_at,updated_at,duration_minutes,notes,processing_status,processing_error,transcript,summary").eq("id", id).single(),
    supabase.from("participants").select("id,name").eq("meeting_id", id).order("id"),
    supabase.from("decisions").select("id,content").eq("meeting_id", id).order("created_at"),
    supabase.from("action_items").select("id,content,assignee,due_date,completed").eq("meeting_id", id).order("created_at"),
  ]);
  if (!meeting) notFound();

  const status = meeting.processing_status as ProcessingStatus;
  const completed = status === "completed";
  const notes = parseNotes(meeting.notes);
  const participantNames = participants?.map((participant) => participant.name) ?? [];
  const decisionContents = decisions?.map((decision) => decision.content) ?? [];
  const actionItems = (actions ?? []) as ActionItem[];
  const exportActions = actionItems.map((action) => ({ content: action.content, assignee: action.assignee, dueDate: action.due_date }));

  return (
    <main className="min-h-screen bg-muted/30 p-5 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" className="mb-4 -ml-3 print:hidden"><Link href="/"><ArrowLeft /> Voltar às reuniões</Link></Button>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">MEMÓRIA EXECUTIVA DA REUNIÃO</p>
            <MeetingEditableField meetingId={meeting.id} field="title" value={meeting.title} singleLine>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{meeting.title}</h1>
            </MeetingEditableField>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatDateTime(meeting.occurred_at)}{meeting.duration_minutes ? ` · Duração: ${meeting.duration_minutes} min` : ""}
            </p>
          </div>
          <Badge variant={completed ? "success" : "warning"}>{statusLabel(status, meeting.updated_at)}</Badge>
        </div>

        {!completed ? (
          <MeetingProcessingPanel meetingId={meeting.id} status={status} processingError={meeting.processing_error} updatedAt={meeting.updated_at} />
        ) : (
          <div className="grid gap-6">
            <MeetingExportActions meeting={{
              title: meeting.title,
              occurredAt: meeting.occurred_at,
              durationMinutes: meeting.duration_minutes,
              participants: participantNames,
              objective: notes.objective ?? "Não identificado automaticamente.",
              mainPoints: notes.main_points ?? [],
              summary: meeting.summary,
              decisions: decisionContents,
              actionItems: exportActions,
              validationPoints: notes.validation_points ?? [],
            }} />

            <Card>
              <CardHeader><div className="flex items-center gap-2"><FileText className="size-5 text-primary" /><CardTitle>Objetivo e pauta</CardTitle></div></CardHeader>
              <CardContent>
                <MeetingEditableField meetingId={meeting.id} field="objective" value={notes.objective ?? ""} rows={4}>
                  <p className="whitespace-pre-wrap text-sm leading-6">{notes.objective || "Não identificado automaticamente."}</p>
                </MeetingEditableField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Participantes</CardTitle></CardHeader>
              <CardContent>
                <MeetingListEditor
                  meetingId={meeting.id}
                  kind="participant"
                  items={participants?.map((participant) => ({ id: participant.id, content: participant.name })) ?? []}
                  emptyLabel="Não identificados automaticamente."
                  placeholder="Adicionar participante"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Principais pontos discutidos</CardTitle></CardHeader>
              <CardContent>
                <MeetingEditableField meetingId={meeting.id} field="main_points" value={(notes.main_points ?? []).join("\n")} rows={6} hint="Um ponto por linha.">
                  {notes.main_points?.length
                    ? <ul className="space-y-3">{notes.main_points.map((point) => <li className="flex gap-2 text-sm leading-6" key={point}><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />{point}</li>)}</ul>
                    : <p className="text-sm text-muted-foreground">Não identificados automaticamente.</p>}
                </MeetingEditableField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Síntese executiva</CardTitle><CardDescription>Resumo objetivo gerado a partir do áudio.</CardDescription></CardHeader>
              <CardContent>
                <MeetingEditableField meetingId={meeting.id} field="summary" value={meeting.summary ?? ""} rows={8}>
                  <p className="whitespace-pre-wrap text-sm leading-6">{meeting.summary}</p>
                </MeetingEditableField>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><div className="flex items-center gap-2"><ClipboardCheck className="size-5 text-primary" /><CardTitle>Decisões e alinhamentos</CardTitle></div></CardHeader>
                <CardContent>
                  <MeetingListEditor
                    meetingId={meeting.id}
                    kind="decision"
                    items={decisions ?? []}
                    emptyLabel="Nenhuma decisão explícita identificada."
                    placeholder="Adicionar decisão"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center gap-2"><ListChecks className="size-5 text-primary" /><CardTitle>Encaminhamentos</CardTitle></div></CardHeader>
                <CardContent>
                  <MeetingActionItemsEditor meetingId={meeting.id} items={actionItems} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Pontos que ainda precisam de validação</CardTitle></CardHeader>
              <CardContent>
                <MeetingEditableField meetingId={meeting.id} field="validation_points" value={(notes.validation_points ?? []).join("\n")} rows={5} hint="Um ponto por linha.">
                  {notes.validation_points?.length
                    ? <ul className="space-y-3">{notes.validation_points.map((point) => <li className="flex gap-2 text-sm leading-6" key={point}><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />{point}</li>)}</ul>
                    : <p className="text-sm text-muted-foreground">Nenhum ponto pendente identificado.</p>}
                </MeetingEditableField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Transcrição</CardTitle><CardDescription>Texto extraído do áudio original.</CardDescription></CardHeader>
              <CardContent>
                <MeetingEditableField meetingId={meeting.id} field="transcript" value={meeting.transcript ?? ""} rows={14}>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{meeting.transcript}</p>
                </MeetingEditableField>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
