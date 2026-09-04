import Link from "next/link";
import { ArrowLeft, Building2, Mic2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login, signup } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.05fr]">
      <section className="hidden border-r bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold"><span className="grid size-9 place-items-center rounded-lg bg-primary-foreground/10"><Mic2 className="size-5" /></span>Memória de Reuniões</Link>
        <div className="max-w-lg"><Building2 className="size-8" /><h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight">Registros institucionais claros, acessíveis e organizados.</h1><p className="mt-5 text-base leading-7 text-primary-foreground/75">Centralize reuniões, decisões e encaminhamentos da sua unidade em um ambiente protegido.</p></div>
        <p className="flex items-center gap-2 text-xs text-primary-foreground/65"><ShieldCheck className="size-4" /> Acesso restrito a usuários autorizados</p>
      </section>
      <section className="grid place-items-center p-5 sm:p-8">
        <div className="w-full max-w-md"><Button asChild variant="ghost" className="mb-4 -ml-3"><Link href="/"><ArrowLeft /> Voltar</Link></Button><Card><CardHeader className="pb-4"><div className="mb-4 grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground lg:hidden"><Mic2 className="size-5" /></div><CardTitle className="text-2xl">Acessar o ambiente</CardTitle><CardDescription>Use seu e-mail institucional para entrar.</CardDescription></CardHeader><CardContent>{params.message ? <p role="alert" className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">{String(params.message)}</p> : null}<form className="space-y-4"><label className="grid gap-2 text-sm font-medium">E-mail institucional<Input name="email" type="email" autoComplete="email" required placeholder="nome@orgao.gov.br" /></label><label className="grid gap-2 text-sm font-medium">Senha<Input name="password" type="password" autoComplete="current-password" required minLength={6} placeholder="Digite sua senha" /></label><Button formAction={login} className="mt-2 w-full">Entrar</Button><Button formAction={signup} variant="outline" className="w-full">Solicitar primeiro acesso</Button></form><p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Ao continuar, você declara estar autorizado a acessar as informações desta unidade.</p></CardContent></Card></div>
      </section>
    </main>
  );
}
