"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { baseMimeType, extensionFor } from "@/lib/audio";
import { barCapacity, downsamplePeaks, drawBars, peakOf } from "@/lib/waveform";

/** Formatos aceitos pelo bucket, em ordem de preferência. */
const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

/** Intervalo entre barras da onda. Mais curto que isso, a onda rola rápido demais para ser lida. */
const SAMPLE_INTERVAL_MS = 55;

type RecorderStatus = "idle" | "recording" | "paused" | "ready";

function supportedMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function formatElapsed(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function MeetingRecorder({ onRecorded, disabled }: { onRecorded: (file: File | null) => void; disabled: boolean }) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const previewRef = useRef<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const samplerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelsRef = useRef<number[]>([]);
  /** Falso enquanto a gravação está pausada: a onda congela em vez de zerar. */
  const capturingRef = useRef(false);

  useEffect(() => {
    if (status !== "recording") return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Linha de base enquanto nada foi gravado.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && status === "idle") drawBars(canvas, []);
  }, [status]);

  const stopVisualizer = useCallback(() => {
    if (samplerRef.current) clearInterval(samplerRef.current);
    samplerRef.current = null;
    capturingRef.current = false;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  }, []);

  const releasePreview = useCallback(() => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreviewUrl(null);
  }, []);

  useEffect(() => () => {
    if (samplerRef.current) clearInterval(samplerRef.current);
    void audioContextRef.current?.close().catch(() => {});
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  /** O visualizador é um extra: se a Web Audio API falhar, a gravação continua. */
  const startVisualizer = useCallback((stream: MediaStream) => {
    try {
      const AudioContextCtor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const context = new AudioContextCtor();
      if (context.state === "suspended") void context.resume().catch(() => {});
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);

      audioContextRef.current = context;
      levelsRef.current = [];
      capturingRef.current = true;

      // Intervalo em vez de requestAnimationFrame: a amostragem não pode parar
      // quando a aba vai para segundo plano, senão a onda fica menor que o áudio.
      samplerRef.current = setInterval(() => {
        if (!capturingRef.current) return;
        analyser.getByteTimeDomainData(samples);
        levelsRef.current.push(peakOf(samples));
        const canvas = canvasRef.current;
        if (canvas) drawBars(canvas, levelsRef.current);
      }, SAMPLE_INTERVAL_MS);
    } catch {
      stopVisualizer();
    }
  }, [stopVisualizer]);

  async function start() {
    setError(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador não permite gravar áudio. Use a aba "Enviar arquivo".');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mimeType = supportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());

        // Congela a onda completa da gravação antes de desligar o analisador.
        const canvas = canvasRef.current;
        const recorded = levelsRef.current;
        if (canvas) drawBars(canvas, downsamplePeaks(recorded, barCapacity(canvas.clientWidth)));
        stopVisualizer();

        const type = baseMimeType(recorder.mimeType || mimeType || "audio/webm");
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (!blob.size) {
          setStatus("idle");
          setError("A gravação ficou vazia. Verifique o microfone e tente novamente.");
          return;
        }
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        const file = new File([blob], `gravacao-${stamp}.${extensionFor(type)}`, { type });
        const url = URL.createObjectURL(blob);
        previewRef.current = url;
        setPreviewUrl(url);
        setStatus("ready");
        onRecorded(file);
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      releasePreview();
      setElapsed(0);
      setStatus("recording");
      startVisualizer(stream);
    } catch {
      setError("Não foi possível acessar o microfone. Autorize o uso no navegador e tente novamente.");
    }
  }

  function pause() {
    recorderRef.current?.pause();
    capturingRef.current = false;
    setStatus("paused");
  }

  function resume() {
    recorderRef.current?.resume();
    capturingRef.current = true;
    setStatus("recording");
  }

  function finish() {
    recorderRef.current?.stop();
  }

  function discard() {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    chunksRef.current = [];
    stopVisualizer();
    levelsRef.current = [];
    releasePreview();
    setElapsed(0);
    setStatus("idle");
    setError(null);
    onRecorded(null);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center gap-4">
          <div className={`grid size-11 shrink-0 place-items-center rounded-full ${status === "recording" ? "animate-pulse bg-red-600 text-white" : "bg-primary text-primary-foreground"}`}>
            <Mic className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-lg font-semibold tabular-nums">{formatElapsed(elapsed)}</p>
            <p className="text-xs text-muted-foreground">
              {status === "idle" ? "Pronto para gravar" : null}
              {status === "recording" ? "Gravando a reunião..." : null}
              {status === "paused" ? "Gravação pausada" : null}
              {status === "ready" ? "Gravação encerrada. Ouça antes de enviar." : null}
            </p>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`h-14 w-full ${status === "recording" ? "text-red-600" : "text-primary"}`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {status === "idle" ? <Button type="button" onClick={start} disabled={disabled}><Mic /> Iniciar gravação</Button> : null}
        {status === "recording" ? <Button type="button" variant="outline" onClick={pause}><Pause /> Pausar</Button> : null}
        {status === "paused" ? <Button type="button" variant="outline" onClick={resume}><Play /> Continuar</Button> : null}
        {status === "recording" || status === "paused" ? <Button type="button" onClick={finish}><Square /> Encerrar</Button> : null}
        {status !== "idle" ? <Button type="button" variant="ghost" onClick={discard} disabled={disabled}><Trash2 /> Descartar</Button> : null}
      </div>

      {previewUrl ? <audio controls src={previewUrl} className="w-full" aria-label="Prévia da gravação" /> : null}
      {error ? <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">{error}</p> : null}
    </div>
  );
}
