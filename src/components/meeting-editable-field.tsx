"use client";

import { useState } from "react";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateMeetingField } from "@/app/meetings/[id]/actions";
import { useEditAction } from "@/lib/use-edit-action";

/** Mostra o conteúdo já gerado e troca por um formulário quando o usuário decide corrigir. */
export function MeetingEditableField({ meetingId, field, value, hint, rows = 6, singleLine = false, children }: {
  meetingId: string;
  field: string;
  value: string;
  hint?: string;
  rows?: number;
  singleLine?: boolean;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const { pending, error, submit } = useEditAction(updateMeetingField);

  if (!editing) {
    return (
      <div>
        {children}
        <Button type="button" variant="ghost" size="sm" className="mt-3 -ml-3 print:hidden" onClick={() => setEditing(true)}>
          <Pencil /> Editar
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget), () => setEditing(false));
      }}
    >
      <input type="hidden" name="meetingId" value={meetingId} />
      <input type="hidden" name="field" value={field} />
      {singleLine
        ? <Input name="value" defaultValue={value} disabled={pending} autoFocus />
        : <Textarea name="value" defaultValue={value} rows={rows} disabled={pending} autoFocus />}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p role="alert" className="text-sm text-amber-800">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Check />} Salvar</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}><X /> Cancelar</Button>
      </div>
    </form>
  );
}
