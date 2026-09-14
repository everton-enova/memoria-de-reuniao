"use client";

import { useState } from "react";
import { Check, CheckCircle2, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addDecision,
  addParticipant,
  deleteDecision,
  deleteParticipant,
  updateDecision,
  updateParticipant,
} from "@/app/meetings/[id]/actions";
import { useEditAction } from "@/lib/use-edit-action";

export type ListItem = { id: string; content: string };
type Kind = "decision" | "participant";

const ACTIONS = {
  decision: { add: addDecision, update: updateDecision, remove: deleteDecision },
  participant: { add: addParticipant, update: updateParticipant, remove: deleteParticipant },
} as const;

/** Lista editável de textos simples: decisões e participantes. */
export function MeetingListEditor({ meetingId, kind, items, emptyLabel, placeholder }: {
  meetingId: string;
  kind: Kind;
  items: ListItem[];
  emptyLabel: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      {items.length
        ? <ul className="space-y-1">{items.map((item) => <Row key={item.id} meetingId={meetingId} kind={kind} item={item} />)}</ul>
        : <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
      <AddForm meetingId={meetingId} kind={kind} placeholder={placeholder} />
    </div>
  );
}

function Row({ meetingId, kind, item }: { meetingId: string; kind: Kind; item: ListItem }) {
  const [editing, setEditing] = useState(false);
  const { pending, error, submit } = useEditAction(ACTIONS[kind].update);

  if (editing) {
    return (
      <li>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(new FormData(event.currentTarget), () => setEditing(false));
          }}
        >
          <input type="hidden" name="meetingId" value={meetingId} />
          <input type="hidden" name="id" value={item.id} />
          <Input name="content" defaultValue={item.content} disabled={pending} autoFocus />
          {error ? <p role="alert" className="text-sm text-amber-800">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Check />} Salvar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}><X /> Cancelar</Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-2 rounded-md py-1 text-sm">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 leading-6">{item.content}</span>
      <div className="flex shrink-0 gap-1 print:hidden">
        <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Editar: ${item.content}`} onClick={() => setEditing(true)}><Pencil /></Button>
        <form action={ACTIONS[kind].remove}>
          <input type="hidden" name="meetingId" value={meetingId} />
          <input type="hidden" name="id" value={item.id} />
          <Button type="submit" variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600" aria-label={`Remover: ${item.content}`}><Trash2 /></Button>
        </form>
      </div>
    </li>
  );
}

function AddForm({ meetingId, kind, placeholder }: { meetingId: string; kind: Kind; placeholder: string }) {
  const { pending, error, submit } = useEditAction(ACTIONS[kind].add);

  return (
    <form
      className="space-y-2 print:hidden"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        submit(new FormData(form), () => form.reset());
      }}
    >
      <input type="hidden" name="meetingId" value={meetingId} />
      <div className="flex gap-2">
        <Input name="content" placeholder={placeholder} disabled={pending} />
        <Button type="submit" variant="outline" size="icon" className="shrink-0" disabled={pending} aria-label="Adicionar">
          {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
        </Button>
      </div>
      {error ? <p role="alert" className="text-sm text-amber-800">{error}</p> : null}
    </form>
  );
}
