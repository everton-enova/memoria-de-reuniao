"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileAudio, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const ACCEPTED_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg"];

export function MeetingUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setMessage("Selecione um arquivo de áudio para continuar.");
    if (!ACCEPTED_TYPES.includes(file.type)) return setMessage("Envie um arquivo MP3, M4A, WAV, WebM ou OGG.");
    if (file.size > MAX_AUDIO_BYTES) return setMessage("No plano atual, o áudio deve ter no máximo 25 MB.");

    setSubmitting(true);
    setMessage("Preparando o envio seguro do áudio...");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const meetingId = crypto.randomUUID();
    const extension = file.name.split(".").pop()?.toLowerCase() || "webm";
    const path = `${user.id}/${meetingId}.${extension}`;
    const meetingTitle = title.trim() || `Reunião de ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date())}`;

    const { error: meetingError } = await supabase.from("meetings").insert({
      id: meetingId,
      owner_id: user.id,
      title: meetingTitle,
      processing_status: "draft",
    });
    if (meetingError) {
      setSubmitting(false);
      return setMessage("Não foi possível criar o registro da reunião. Tente novamente.");
    }

    const { error: uploadError } = await supabase.storage.from("meeting-audios").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) {
      await supabase.from("meetings").delete().eq("id", meetingId);
      setSubmitting(false);
      return setMessage("Não foi possível enviar o áudio. Tente novamente.");
    }

    await supabase.from("meetings").update({
      audio_path: path,
      audio_mime_type: file.type,
      audio_size_bytes: file.size,
      processing_status: "uploaded",
    }).eq("id", meetingId);

    setMessage("Transcrevendo e organizando a memória da reunião...");
    const response = await fetch(`/api/meetings/${meetingId}/process`, { method: "POST" });
    if (!response.ok) {
      setSubmitting(false);
      return setMessage("O áudio foi salvo, mas houve falha no processamento. Abra a reunião e tente novamente.");
    }

    router.push(`/meetings/${meetingId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="grid gap-2 text-sm font-medium">
        Assunto da reunião
        <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Ex.: Planejamento mensal da unidade" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Arquivo de áudio
        <Input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/webm,audio/ogg,.mp3,.m4a,.wav,.webm,.ogg" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={submitting} />
        <span className="text-xs font-normal text-muted-foreground">MP3, M4A, WAV, WebM ou OGG · até 25 MB</span>
      </label>
      {file ? <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm"><FileAudio className="size-5 text-primary" /><span className="min-w-0 flex-1 truncate">{file.name}</span><span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span></div> : null}
      {message ? <p role="status" className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <LoaderCircle className="animate-spin" /> : <Upload />} {submitting ? "Processando reunião" : "Enviar e gerar memória"}</Button>
    </form>
  );
}
