"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-lg bg-amber-50 text-amber-700"><TriangleAlert className="size-5" /></div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Não foi possível carregar esta página</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente novamente. Se o problema continuar, verifique a configuração do ambiente e a conexão com o Supabase.</p>
        <Button className="mt-6" onClick={() => retry()}>Tentar novamente</Button>
      </div>
    </main>
  );
}
