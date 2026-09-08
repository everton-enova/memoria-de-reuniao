import Link from "next/link";
import { ArrowLeft, Mic2, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { MeetingUploadForm } from "@/components/meeting-upload-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function NewMeetingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <main className="min-h-screen bg-muted/30 p-5 sm:p-8"><div className="mx-auto max-w-2xl"><Button asChild variant="ghost" className="mb-4 -ml-3"><Link href="/"><ArrowLeft /> Voltar às reuniões</Link></Button><Card><CardHeader><div className="mb-3 grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Mic2 className="size-5" /></div><CardTitle className="text-2xl">Nova memória de reunião</CardTitle><CardDescription>Envie o áudio. A transcrição e o resumo são gerados em nuvem e ficam vinculados somente à sua conta.</CardDescription></CardHeader><CardContent><MeetingUploadForm /><p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" /> O áudio é armazenado em um bucket privado do Supabase.</p></CardContent></Card></div></main>;
}
