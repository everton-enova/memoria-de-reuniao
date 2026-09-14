"use client";

import { useState, useTransition } from "react";
import type { EditResult } from "@/app/meetings/[id]/actions";

type EditAction = (previous: EditResult, formData: FormData) => Promise<EditResult>;

/**
 * Envia um formulário de edição e mantém a mensagem de erro devolvida pela action.
 * O fechamento do modo de edição acontece no callback de sucesso, sem efeito.
 */
export function useEditAction(action: EditAction) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      onSuccess?.();
    });
  }

  return { pending, error, submit };
}
