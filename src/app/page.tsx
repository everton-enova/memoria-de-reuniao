import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, ClipboardCheck, Clock3, FileAudio, FileText, ListChecks, LogOut, Mic2, Plus, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { toggleActionItem } from "@/app/actions";
import {
  formatDayMonth,
  formatDueDate,
  formatMinutes,
  isDueToday,
  isOverdue,
  isStalled,
  statusLabel,
  type ProcessingStatus,
} from "@/lib/meetings";

type MeetingRow = {
  id: string;
  title: string;
  occurred_at: string;
  updated_at: string | null;
  duration_minutes: number | null;
  processing_status: ProcessingStatus;
};

type EmbeddedMeeting = { title: string };

type ActionItemRow = {
  id: string;
  content: string;
  due_date: string | null;
  meeting_id: string;
  // PostgREST devolve um objeto para esta relação; o cliente sem tipos gerados a infere como lista.
  meetings: EmbeddedMeeting | EmbeddedMeeting[] | null;
};

function meetingTitleOf(action: ActionItemRow) {
  const related = Array.isArray(action.meetings) ? action.meetings[0] : action.meetings;
  return related?.title ?? "Reunião";
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const query = String((await searchParams).q ?? "").trim();

  let meetingsQuery = supabase
    .from("meetings")
    .select("id,title,occurred_at,updated_at,duration_minutes,processing_status")
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (query) meetingsQuery = meetingsQuery.ilike("title", `%${query}%`);

  const [{ data: meetingRows }, { data: actionRows }, { count: decisionCount }] = await Promise.all([
    meetingsQuery,
    supabase
      .from("action_items")
      .select("id,content,due_date,meeting_id,meetings!inner(title)")
      .eq("completed", false)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(100),
    supabase.from("decisions").select("id", { count: "exact", head: true }),
  ]);

  const meetings = (meetingRows ?? []) as MeetingRow[];
  const openActions = (actionRows ?? []) as unknown as ActionItemRow[];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthMeetings = meetings.filter((meeting) => new Date(meeting.occurred_at) >= monthStart);
  const recordedMinutes = meetings.reduce((total, meeting) => total + (meeting.duration_minutes ?? 0), 0);
  const dueTodayCount = openActions.filter((action) => isDueToday(action.due_date)).length;

  const profileInitials = (user.email ?? "US")
    .split("@")[0]
    .split(/[.\s_-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "US";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Mic2 className="size-5" /></div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Memória de Reuniões</p>
              <p className="truncate text-xs text-muted-foreground">Ambiente institucional</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden sm:inline-flex"><Link href="/meetings/new"><FileAudio /> Importar áudio</Link></Button>
            <Button asChild><Link href="/meetings/new"><Plus /> Nova reunião</Link></Button>
            <div aria-label={`Perfil de ${user.email ?? "usuário"}`} title={user.email ?? undefined} className="ml-1 grid size-9 place-items-center rounded-full border bg-muted text-xs font-semibold">{profileInitials}</div>
            <form action={logout}><Button type="submit" variant="ghost" size="icon" aria-label="Sair da conta"><LogOut /></Button></form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[240px_1fr]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r p-4 lg:block">
          <div className="mb-5 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Building2 className="size-4" /> Usuário conectado</div>
            <p className="mt-2 truncate text-sm font-semibold" title={user.email ?? undefined}>{user.email ?? "Sessão ativa"}</p>
          </div>
          <nav aria-label="Navegação principal" className="space-y-1">
            <NavItem active href="#reunioes" icon={<FileText />} label="Reuniões" count={meetings.length ? String(meetings.length) : undefined} />
            <NavItem href="#encaminhamentos" icon={<ListChecks />} label="Encaminhamentos" count={openActions.length ? String(openActions.length) : undefined} />
          </nav>
          <Separator className="my-5" />
          <div className="rounded-lg bg-primary p-4 text-primary-foreground">
            <ShieldCheck className="size-5" />
            <p className="mt-3 text-sm font-semibold">Informação protegida</p>
            <p className="mt-1 text-xs leading-5 text-primary-foreground/75">Áudios e registros ficam restritos à sua conta pelas políticas de acesso do banco.</p>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Badge variant="outline" className="mb-3"><CalendarDays className="mr-1.5 size-3.5" /> {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date())}</Badge>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Visão geral da unidade</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">Acompanhe reuniões, decisões registradas e encaminhamentos pendentes.</p>
            </div>
            <form className="relative w-full xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={query} aria-label="Buscar reuniões pelo assunto" className="h-10 bg-card pl-9" placeholder="Buscar pelo assunto da reunião" />
            </form>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<CalendarDays />} label="Reuniões no mês" value={String(monthMeetings.length)} note={`${meetings.length} no total`} />
            <Metric icon={<Clock3 />} label="Tempo registrado" value={formatMinutes(recordedMinutes)} note="Áudios processados" />
            <Metric icon={<ClipboardCheck />} label="Decisões registradas" value={String(decisionCount ?? 0)} note="Em todas as reuniões" />
            <Metric icon={<ListChecks />} label="Encaminhamentos abertos" value={String(openActions.length)} note={dueTodayCount ? `${dueTodayCount} com prazo hoje` : "Nenhum com prazo hoje"} attention={dueTodayCount > 0} />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
            <Card id="reunioes" className="scroll-mt-20">
              <CardHeader>
                <CardTitle>{query ? "Resultados da busca" : "Reuniões recentes"}</CardTitle>
                <CardDescription className="mt-1.5">{query ? `Reuniões com "${query}" no assunto` : "Registros mais recentes da sua conta"}</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {meetings.length ? (
                  <div className="divide-y">
                    {meetings.map((meeting) => {
                      const stalled = isStalled(meeting.processing_status, meeting.updated_at);
                      const done = meeting.processing_status === "completed";
                      const broken = meeting.processing_status === "failed" || stalled;
                      return (
                        <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
                          <div className="grid size-10 shrink-0 place-items-center rounded-lg border bg-muted text-xs font-semibold">{formatDayMonth(meeting.occurred_at)}</div>
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-semibold group-hover:text-primary">{meeting.title}</h2>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{meeting.duration_minutes ? `${meeting.duration_minutes} min · ` : ""}{statusLabel(meeting.processing_status, meeting.updated_at)}</p>
                          </div>
                          <Badge variant={done ? "success" : broken ? "warning" : "secondary"} className="hidden sm:inline-flex">{statusLabel(meeting.processing_status, meeting.updated_at)}</Badge>
                          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <FileText className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-4 text-sm font-medium">{query ? "Nenhuma reunião encontrada" : "Nenhuma reunião registrada ainda"}</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{query ? "Ajuste os termos da busca ou limpe o campo para ver todas as reuniões." : "Grave pelo navegador ou envie um arquivo de áudio para gerar a primeira memória."}</p>
                    {query ? <Button asChild variant="outline" className="mt-5"><Link href="/">Limpar busca</Link></Button> : <Button asChild className="mt-5"><Link href="/meetings/new"><Plus /> Registrar reunião</Link></Button>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card id="encaminhamentos" className="scroll-mt-20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Encaminhamentos</CardTitle>
                  <Badge variant="secondary">{openActions.length} aberto{openActions.length === 1 ? "" : "s"}</Badge>
                </div>
                <CardDescription>Prazos e responsáveis pendentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {openActions.length ? openActions.slice(0, 8).map((action) => (
                  <Task
                    key={action.id}
                    id={action.id}
                    title={action.content}
                    owner={meetingTitleOf(action)}
                    meetingId={action.meeting_id}
                    dueDate={action.due_date}
                  />
                )) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum encaminhamento em aberto.</p>
                )}
                {openActions.length > 8 ? <p className="pt-3 text-center text-xs text-muted-foreground">e mais {openActions.length - 8} em aberto</p> : null}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-primary/20 bg-primary/[0.035]">
            <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Mic2 className="size-5" /></div>
                <div>
                  <h2 className="font-semibold">Registrar uma nova reunião</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Grave pelo navegador ou envie um arquivo de áudio para gerar a memória automaticamente.</p>
                </div>
              </div>
              <Button asChild size="lg"><Link href="/meetings/new">Iniciar registro <ArrowUpRight /></Link></Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function NavItem({ icon, label, count, href, active = false }: { icon: React.ReactNode; label: string; count?: string; href: string; active?: boolean }) {
  return (
    <a href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
      {icon}<span>{label}</span>{count ? <Badge variant="secondary" className="ml-auto">{count}</Badge> : null}
    </a>
  );
}

function Metric({ icon, label, value, note, attention = false }: { icon: React.ReactNode; label: string; value: string; note: string; attention?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">{icon}</div>
          {attention ? <Badge variant="warning">Atenção</Badge> : null}
        </div>
        <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function Task({ id, title, owner, meetingId, dueDate }: { id: string; title: string; owner: string; meetingId: string; dueDate: string | null }) {
  const urgent = isDueToday(dueDate) || isOverdue(dueDate);
  return (
    <div className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/60">
      <form action={toggleActionItem} className="mt-0.5 shrink-0">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="completed" value="false" />
        <button type="submit" aria-label={`Concluir: ${title}`} className="size-5 rounded-full border-2 border-muted-foreground/35 outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring" />
      </form>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5">{title}</p>
        <Link href={`/meetings/${meetingId}`} className="mt-1 block truncate text-xs text-muted-foreground hover:text-primary">{owner}</Link>
      </div>
      <span className={cn("shrink-0 text-xs font-medium", urgent ? "text-amber-700" : "text-muted-foreground")}>{dueDate ? formatDueDate(dueDate) : "Sem prazo"}</span>
    </div>
  );
}
