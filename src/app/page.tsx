import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, ArrowUpRight, Building2, CalendarDays, ClipboardCheck, Clock3, FileAudio, FileText, ListChecks, Mic2, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const meetings = [
  { date: "04 set", title: "Reunião de planejamento da unidade", area: "Coordenação Administrativa", time: "09:30 · 52 min", people: "6 participantes", status: "Finalizada" },
  { date: "03 set", title: "Alinhamento semanal de projetos", area: "Núcleo de Projetos", time: "14:00 · 38 min", people: "4 participantes", status: "Finalizada" },
  { date: "02 set", title: "Comitê de acompanhamento", area: "Gabinete", time: "11:00 · 45 min", people: "8 participantes", status: "Em revisão" },
];

const tasks = [
  { title: "Consolidar contribuições para o plano de ação", owner: "Coordenação Administrativa", due: "Hoje" },
  { title: "Validar cronograma de entregas do trimestre", owner: "Núcleo de Projetos", due: "Amanhã" },
  { title: "Encaminhar minuta para análise técnica", owner: "Assessoria Técnica", due: "6 set" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
          <div className="flex min-w-0 items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Mic2 className="size-5" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">Memória de Reuniões</p><p className="truncate text-xs text-muted-foreground">Ambiente institucional</p></div></div>
          <div className="flex items-center gap-2"><Button asChild variant="outline" className="hidden sm:inline-flex"><Link href="/meetings/new"><FileAudio /> Importar áudio</Link></Button><Button asChild><Link href="/meetings/new"><Plus /> Nova reunião</Link></Button><div aria-label={`Perfil de ${user.email ?? "usuário"}`} className="ml-1 grid size-9 place-items-center rounded-full border bg-muted text-xs font-semibold">{profileInitials}</div></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[240px_1fr]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r p-4 lg:block">
          <div className="mb-5 rounded-lg border bg-muted/40 p-3"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Building2 className="size-4" /> Unidade atual</div><p className="mt-2 text-sm font-semibold">Coordenação Administrativa</p></div>
          <nav aria-label="Navegação principal" className="space-y-1"><NavItem active icon={<FileText />} label="Reuniões" /><NavItem icon={<ListChecks />} label="Encaminhamentos" count="4" /><NavItem icon={<Users />} label="Participantes" /><NavItem icon={<Archive />} label="Arquivo" /></nav>
          <Separator className="my-5" />
          <div className="rounded-lg bg-primary p-4 text-primary-foreground"><ShieldCheck className="size-5" /><p className="mt-3 text-sm font-semibold">Informação protegida</p><p className="mt-1 text-xs leading-5 text-primary-foreground/75">Áudios e registros ficam restritos aos usuários autorizados da unidade.</p></div>
        </aside>

        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div><Badge variant="outline" className="mb-3"><CalendarDays className="mr-1.5 size-3.5" /> 4 de setembro de 2026</Badge><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Visão geral da unidade</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">Acompanhe reuniões, decisões registradas e encaminhamentos pendentes.</p></div>
            <div className="relative w-full xl:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar reuniões" className="h-10 bg-card pl-9" placeholder="Buscar por assunto, unidade ou pessoa" /></div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<CalendarDays />} label="Reuniões no mês" value="12" note="3 nesta semana" /><Metric icon={<Clock3 />} label="Tempo registrado" value="8h 42min" note="Áudios processados" /><Metric icon={<ClipboardCheck />} label="Decisões registradas" value="18" note="No mês atual" /><Metric icon={<ListChecks />} label="Encaminhamentos abertos" value="4" note="2 com prazo hoje" attention /></div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
            <Card><CardHeader className="flex-row items-center justify-between gap-4"><div><CardTitle>Reuniões recentes</CardTitle><CardDescription className="mt-1.5">Registros mais recentes da unidade</CardDescription></div><Button variant="ghost" size="sm">Ver todas <ArrowUpRight /></Button></CardHeader><CardContent className="px-0 pb-0"><div className="divide-y">{meetings.map((meeting) => <article key={meeting.title} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"><div className="grid size-10 shrink-0 place-items-center rounded-lg border bg-muted text-xs font-semibold">{meeting.date}</div><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold group-hover:text-primary">{meeting.title}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{meeting.area} · {meeting.time} · {meeting.people}</p></div><Badge variant={meeting.status === "Finalizada" ? "success" : "warning"} className="hidden sm:inline-flex">{meeting.status}</Badge><Button aria-label={`Abrir ${meeting.title}`} variant="ghost" size="icon"><ArrowUpRight /></Button></article>)}</div></CardContent></Card>
            <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Encaminhamentos</CardTitle><Badge variant="secondary">4 abertos</Badge></div><CardDescription>Prazos e responsáveis prioritários</CardDescription></CardHeader><CardContent className="space-y-1">{tasks.map((task, index) => <Task key={task.title} {...task} urgent={index < 2} />)}<Button variant="outline" className="mt-4 w-full">Ver todos os encaminhamentos</Button></CardContent></Card>
          </div>

          <Card className="mt-6 border-primary/20 bg-primary/[0.035]"><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Mic2 className="size-5" /></div><div><h2 className="font-semibold">Registrar uma nova reunião</h2><p className="mt-1 text-sm text-muted-foreground">Grave pelo navegador ou envie um arquivo de áudio para gerar a memória automaticamente.</p></div></div><Button asChild size="lg"><Link href="/meetings/new">Iniciar registro <ArrowUpRight /></Link></Button></CardContent></Card>
        </section>
      </div>
    </main>
  );
}

function NavItem({ icon, label, count, active = false }: { icon: React.ReactNode; label: string; count?: string; active?: boolean }) { return <a href="#" aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>{icon}<span>{label}</span>{count ? <Badge variant="secondary" className="ml-auto">{count}</Badge> : null}</a>; }
function Metric({ icon, label, value, note, attention = false }: { icon: React.ReactNode; label: string; value: string; note: string; attention?: boolean }) { return <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">{icon}</div>{attention ? <Badge variant="warning">Atenção</Badge> : null}</div><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></CardContent></Card>; }
function Task({ title, owner, due, urgent }: { title: string; owner: string; due: string; urgent: boolean }) { return <div className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/60"><button aria-label={`Concluir: ${title}`} className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-muted-foreground/35 outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring" /><div className="min-w-0 flex-1"><p className="text-sm font-medium leading-5">{title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{owner}</p></div><span className={cn("shrink-0 text-xs font-medium", urgent ? "text-amber-700" : "text-muted-foreground")}>{due}</span></div>; }
