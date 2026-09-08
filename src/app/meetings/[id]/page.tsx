import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, ListChecks } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function MeetingPage({ params }: PageProps<"/meetings/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: meeting }, { data: decisions }, { data: actions }] = await Promise.all([
    supabase.from("meetings").select("id,title,occurred_at,processing_status,processing_error,transcript,summary").eq("id", id).single(),
    supabase.from("decisions").select("id,content").eq("meeting_id", id),
    supabase.from("action_items").select("id,content,assignee,due_date").eq("meeting_id", id),
  ]);
  if (!meeting) notFound();

  const completed = meeting.processing_status === "completed";
  return <main className="min-h-screen bg-muted/30 p-5 sm:p-8"><div className="mx-auto max-w-4xl"><Button asChild variant="ghost" className="mb-4 -ml-3"><Link href="/"><ArrowLeft /> Voltar às reuniões</Link></Button><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(meeting.occurred_at))}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{meeting.title}</h1></div><Badge variant={completed ? "success" : "warning"}>{completed ? "Concluída" : meeting.processing_status === "failed" ? "Falha no processamento" : "Processando"}</Badge></div>
  {!completed ? <Card><CardHeader><CardTitle>Processamento da reunião</CardTitle><CardDescription>{meeting.processing_error ?? "A transcrição está sendo preparada. Atualize esta página em instantes."}</CardDescription></CardHeader></Card> : <div className="grid gap-6"><Card><CardHeader><div className="flex items-center gap-2"><FileText className="size-5 text-primary" /><CardTitle>Memória da reunião</CardTitle></div><CardDescription>Resumo gerado a partir do áudio enviado.</CardDescription></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-6">{meeting.summary}</p></CardContent></Card><div className="grid gap-6 md:grid-cols-2"><Card><CardHeader><div className="flex items-center gap-2"><ClipboardCheck className="size-5 text-primary" /><CardTitle>Decisões</CardTitle></div></CardHeader><CardContent>{decisions?.length ? <ul className="space-y-3">{decisions.map((decision) => <li className="flex gap-2 text-sm" key={decision.id}><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{decision.content}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma decisão explícita identificada.</p>}</CardContent></Card><Card><CardHeader><div className="flex items-center gap-2"><ListChecks className="size-5 text-primary" /><CardTitle>Encaminhamentos</CardTitle></div></CardHeader><CardContent>{actions?.length ? <ul className="space-y-3">{actions.map((action) => <li className="text-sm" key={action.id}><p className="font-medium">{action.content}</p><p className="mt-1 text-xs text-muted-foreground">{action.assignee ?? "Responsável não identificado"}{action.due_date ? ` · prazo ${new Intl.DateTimeFormat("pt-BR").format(new Date(`${action.due_date}T12:00:00`))}` : ""}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum encaminhamento explícito identificado.</p>}</CardContent></Card></div><Card><CardHeader><CardTitle>Transcrição</CardTitle><CardDescription>Texto extraído do áudio original.</CardDescription></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{meeting.transcript}</p></CardContent></Card></div>}</div></main>;
}
