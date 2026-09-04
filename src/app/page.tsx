import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, FileText, Mic2, MoreHorizontal, Plus, Search, Sparkles, Users } from "lucide-react";

const meetings = [
  { day: "04", month: "SET", title: "Planejamento do produto", time: "09:30 · 52 min", people: "Você, Ana, Caio +2", status: "Concluída", color: "bg-violet-500" },
  { day: "03", month: "SET", title: "Alinhamento semanal — Marketing", time: "14:00 · 38 min", people: "Você, Marina, Lucas", status: "Concluída", color: "bg-emerald-500" },
  { day: "02", month: "SET", title: "Entrevista com cliente", time: "11:00 · 45 min", people: "Você, Rafael", status: "Rascunho", color: "bg-amber-500" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200"><Mic2 size={18} strokeWidth={2.5} /></div><span className="text-[17px] font-bold tracking-tight">Memória</span></div>
          <div className="flex items-center gap-3"><button className="hidden rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 sm:block">Importar reunião</button><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"><Plus size={16} /> Nova reunião</Link><div className="ml-1 grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">EB</div></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="space-y-1 text-sm"><a className="flex items-center gap-3 rounded-xl bg-violet-50 px-3 py-2.5 font-semibold text-violet-700" href="#"><FileText size={18} /> Reuniões</a><a className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-slate-500 hover:bg-white" href="#tarefas"><CheckCircle2 size={18} /> Tarefas <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[11px]">4</span></a><a className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-slate-500 hover:bg-white" href="#"><Users size={18} /> Pessoas</a></nav>
          <div className="mt-10 rounded-2xl bg-slate-950 p-4 text-white shadow-xl shadow-slate-200"><Sparkles className="mb-4 text-violet-300" size={21} /><p className="text-sm font-semibold">Sua memória, organizada.</p><p className="mt-1.5 text-xs leading-5 text-slate-400">Decisões e próximos passos sempre à mão.</p></div>
        </aside>

        <section>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-violet-600">Quinta-feira, 4 de setembro</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Bom dia, Everton.</h1><p className="mt-2 text-slate-500">Aqui está o que aconteceu nas suas reuniões.</p></div><label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-400 shadow-sm sm:w-64"><Search size={17} /><input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder="Buscar nas reuniões" /></label></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat icon={<CalendarDays size={19} />} label="Reuniões este mês" value="12" note="3 esta semana" /><Stat icon={<Clock3 size={19} />} label="Tempo registrado" value="8h 42m" note="+18% no mês" /><Stat icon={<CheckCircle2 size={19} />} label="Tarefas em aberto" value="4" note="2 vencem hoje" alert /></div>
          <div className="mt-9 flex items-center justify-between"><h2 className="text-lg font-bold">Reuniões recentes</h2><button className="flex items-center gap-1 text-sm font-semibold text-violet-600">Ver todas <ArrowRight size={15} /></button></div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {meetings.map((meeting, index) => <article key={meeting.title} className={`group flex items-center gap-4 p-4 transition hover:bg-slate-50 sm:p-5 ${index < meetings.length - 1 ? "border-b border-slate-100" : ""}`}><div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100"><span className="text-lg font-bold leading-none">{meeting.day}</span><span className="mt-1 text-[9px] font-bold tracking-wider text-slate-500">{meeting.month}</span></div><div className={`hidden h-9 w-1 rounded-full sm:block ${meeting.color}`} /><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{meeting.title}</h3><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span>{meeting.time}</span><span className="hidden text-slate-300 sm:inline">•</span><span>{meeting.people}</span></p></div><span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline ${meeting.status === "Rascunho" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{meeting.status}</span><button aria-label="Mais opções" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={18} /></button></article>)}
          </div>
          <div id="tarefas" className="mt-9 grid gap-6 xl:grid-cols-[1.35fr_1fr]"><div><h2 className="text-lg font-bold">Próximos passos</h2><div className="mt-4 space-y-3"><Task title="Enviar proposta revisada para o cliente" source="Planejamento do produto" due="Hoje" /><Task title="Validar calendário da campanha" source="Alinhamento semanal — Marketing" due="Amanhã" /></div></div><div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-xl shadow-violet-200/60"><Sparkles className="text-violet-200" size={22} /><h2 className="mt-5 text-xl font-bold">Registre a próxima conversa</h2><p className="mt-2 text-sm leading-6 text-violet-100">Cole uma transcrição ou escreva suas notas. A estrutura já está pronta para decisões e tarefas.</p><Link href="/login" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-violet-700">Começar agora <ArrowRight size={16} /></Link></div></div>
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value, note, alert = false }: { icon: React.ReactNode; label: string; value: string; note: string; alert?: boolean }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-600">{icon}</span><span className={`text-[11px] font-semibold ${alert ? "text-rose-500" : "text-slate-400"}`}>{note}</span></div><p className="mt-5 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>; }
function Task({ title, source, due }: { title: string; source: string; due: string }) { return <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><button aria-label="Concluir tarefa" className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-slate-300 hover:border-violet-500" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 truncate text-xs text-slate-400">{source}</p></div><span className="text-xs font-semibold text-rose-500">{due}</span></div>; }
