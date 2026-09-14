"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isInFlight, isStalled, statusLabel, type ProcessingStatus } from "@/lib/meetings";

const POLL_INTERVAL_MS = 5000;

export function MeetingProcessingPanel({ meetingId, status, processingError, updatedAt }: {
  meetingId: string;
  status: ProcessingStatus;
  processingError: string | null;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const stalled = isStalled(status, updatedAt);
  const running = isInFlight(status) && !stalled;
  const canRetry = status === "failed" || status === "draft" || stalled;

  // Enquanto a transcrição roda, a página se atualiza sozinha até concluir ou falhar.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [running, router]);

  async function retry() {
    setRetrying(true);
    setRetryError(null);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/process`, { method: "POST" });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Não foi possível reiniciar o processamento.");
      router.refresh();
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : "Não foi possível reiniciar o processamento.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {running ? <LoaderCircle className="size-5 animate-spin text-primary" /> : <TriangleAlert className="size-5 text-amber-600" />}
          <CardTitle>{statusLabel(status, updatedAt)}</CardTitle>
        </div>
        <CardDescription>
          {running ? "A transcrição está em andamento. Esta página se atualiza sozinha quando a memória ficar pronta." : null}
          {stalled ? "O processamento não foi concluído — a aba pode ter sido fechada ou o tempo limite foi atingido. Você pode tentar novamente." : null}
          {status === "failed" ? processingError ?? "O processamento falhou." : null}
          {status === "draft" ? "O áudio ainda não foi processado." : null}
        </CardDescription>
      </CardHeader>
      {canRetry ? (
        <CardContent className="space-y-3">
          <Button onClick={retry} disabled={retrying}>
            {retrying ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} {retrying ? "Reiniciando..." : "Processar novamente"}
          </Button>
          {retryError ? <p role="alert" className="text-sm text-amber-800">{retryError}</p> : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
