"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileAudio, LoaderCircle, Mic, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MeetingRecorder } from "@/components/meeting-recorder";
import { createClient } from "@/lib/supabase/client";
import { ACCEPTED_MIME_TYPES, MAX_AUDIO_BYTES, MAX_AUDIO_MB, baseMimeType, extensionFor, isAcceptedAudio } from "@/lib/audio";
import { cn } from "@/lib/utils";

type Mode = "record" | "upload";

function messageFrom(error: unknown) {
  const detail = error instanceof Error ? error.message : "Erro inesperado.";
  return `Não foi possível concluir o envio. ${detail}`;
}

export function MeetingUploadForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("record");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * O input de arquivo é não-controlado: sem zerar o valor dele, escolher o
   * mesmo arquivo de novo não dispara `change` e a seleção não voltaria.
   */
  function clearFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFile(null);
    setMessage(null);
  }

  function chooseMode(next: Mode) {
    if (submitting || next === mode) return;
    setMode(next);
    clearFile();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setMessage(mode === "record" ? "Grave e encerre um áudio para continuar." : "Selecione um arquivo de áudio para continuar.");
    if (!isAcceptedAudio(file.type)) return setMessage("Envie um arquivo MP3, M4A, WAV, FLAC, WebM ou OGG.");
    if (file.size > MAX_AUDIO_BYTES) {
      return setMessage(
        `Este arquivo tem ${(file.size / 1024 / 1024).toFixed(1)} MB e o limite atual é ${MAX_AUDIO_MB} MB. `
        + "A transcrição reduz tudo a 16 kHz mono, então converter o arquivo para esse formato costuma resolver sem perda de qualidade — ou grave pelo aplicativo, que já usa um formato compacto.",
      );
    }

    setSubmitting(true);
    setMessage("Preparando o envio seguro do áudio...");

    const supabase = createClient();
    const meetingId = crypto.randomUUID();
    let meetingCreated = false;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        router.replace("/login");
        return;
      }

      const mimeType = baseMimeType(file.type);
      const path = `${user.id}/${meetingId}.${extensionFor(mimeType)}`;
      const meetingTitle = title.trim() || `Reunião de ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date())}`;

      const { error: meetingError } = await supabase.from("meetings").insert({
        id: meetingId,
        owner_id: user.id,
        title: meetingTitle,
        processing_status: "draft",
      });
      if (meetingError) throw meetingError;
      meetingCreated = true;

      const { error: uploadError } = await supabase.storage.from("meeting-audios").upload(path, file, {
        contentType: mimeType,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: metadataError } = await supabase.from("meetings").update({
        audio_path: path,
        audio_mime_type: mimeType,
        audio_size_bytes: file.size,
        processing_status: "uploaded",
      }).eq("id", meetingId);
      if (metadataError) throw metadataError;

      // O processamento segue em segundo plano. A página da reunião acompanha o
      // andamento e oferece nova tentativa se a transcrição não concluir.
      void fetch(`/api/meetings/${meetingId}/process`, { method: "POST" }).catch(() => {});
      router.push(`/meetings/${meetingId}`);
    } catch (error) {
      console.error("[meeting-upload] failed", error);
      // Sem isso, uma falha no upload deixaria uma reunião sem áudio no histórico.
      if (meetingCreated) await supabase.from("meetings").delete().eq("id", meetingId);
      setMessage(messageFrom(error));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="grid gap-2 text-sm font-medium">
        Assunto da reunião
        <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Ex.: Planejamento mensal da unidade" />
      </label>

      <div className="grid gap-2 text-sm font-medium">
        Origem do áudio
        <div role="tablist" aria-label="Origem do áudio" className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1">
          <ModeTab active={mode === "record"} onClick={() => chooseMode("record")} icon={<Mic />} label="Gravar agora" />
          <ModeTab active={mode === "upload"} onClick={() => chooseMode("upload")} icon={<Upload />} label="Enviar arquivo" />
        </div>
      </div>

      {mode === "record" ? (
        <MeetingRecorder onRecorded={setFile} disabled={submitting} />
      ) : (
        <label className="grid gap-2 text-sm font-medium">
          Arquivo de áudio
          <Input ref={fileInputRef} type="file" accept={`${ACCEPTED_MIME_TYPES.join(",")},.mp3,.m4a,.wav,.flac,.webm,.ogg`} onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={submitting} />
          <span className="text-xs font-normal text-muted-foreground">MP3, M4A, WAV, FLAC, WebM ou OGG · até {MAX_AUDIO_MB} MB</span>
        </label>
      )}

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <FileAudio className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          {mode === "upload" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
              onClick={clearFile}
              disabled={submitting}
              aria-label={`Remover o arquivo ${file.name}`}
              title="Remover arquivo"
            >
              <X />
            </Button>
          ) : null}
        </div>
      ) : null}

      {message ? <p role="status" className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">{message}</p> : null}

      <Button type="submit" className="w-full" disabled={submitting || !file}>
        {submitting ? <LoaderCircle className="animate-spin" /> : <Upload />} {submitting ? "Enviando reunião" : "Enviar e gerar memória"}
      </Button>
    </form>
  );
}

function ModeTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn("flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4", active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
    >
      {icon}{label}
    </button>
  );
}
