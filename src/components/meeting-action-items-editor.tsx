"use client";

import { useState } from "react";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addActionItem,
  deleteActionItem,
  setActionItemCompleted,
  updateActionItem,
} from "@/app/meetings/[id]/actions";
import { useEditAction } from "@/lib/use-edit-action";
import { formatDueDate } from "@/lib/meetings";
import { cn } from "@/lib/utils";

export type ActionItem = {
  id: string;
  content: string;
  assignee: string | null;
  due_date: string | null;
  completed: boolean;
};

export function MeetingActionItemsEditor({ meetingId, items }: { meetingId: string; items: ActionItem[] }) {
  return (
    <div className="space-y-3">
      {items.length
        ? <ul className="space-y-1">{items.map((item) => <Row key={item.id} meetingId={meetingId} item={item} />)}</ul>
        : <p className="text-sm text-muted-foreground">Nenhum encaminhamento explícito identificado.</p>}
      <AddForm meetingId={meetingId} />
    </div>
  );
}

function Row({ meetingId, item }: { meetingId: string; item: ActionItem }) {
  const [editing, setEditing] = useState(false);
  const { pending, error, submit } = useEditAction(updateActionItem);

  if (editing) {
    return (
      <li>
        <form
          className="space-y-2 rounded-lg border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(new FormData(event.currentTarget), () => setEditing(false));
          }}
        >
          <input type="hidden" name="meetingId" value={meetingId} />
          <input type="hidden" name="id" value={item.id} />
          <Input name="content" defaultValue={item.content} placeholder="Encaminhamento" disabled={pending} autoFocus />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input name="assignee" defaultValue={item.assignee ?? ""} placeholder="Responsável" disabled={pending} />
            <Input name="due_date" type="date" defaultValue={item.due_date ?? ""} aria-label="Prazo" disabled={pending} />
          </div>
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
    <li className="flex items-start gap-2 rounded-md py-1 text-sm">
      <form action={setActionItemCompleted} className="mt-0.5 shrink-0 print:hidden">
        <input type="hidden" name="meetingId" value={meetingId} />
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="completed" value={String(item.completed)} />
        <button
          type="submit"
          aria-label={item.completed ? `Reabrir: ${item.content}` : `Concluir: ${item.content}`}
          className={cn("grid size-5 place-items-center rounded-full border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring", item.completed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/35 hover:border-primary")}
        >
          {item.completed ? <Check className="size-3" /> : null}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium leading-5", item.completed && "text-muted-foreground line-through")}>{item.content}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.assignee ?? "Responsável não identificado"}
          {item.due_date ? ` · prazo ${formatDueDate(item.due_date)}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1 print:hidden">
        <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Editar: ${item.content}`} onClick={() => setEditing(true)}><Pencil /></Button>
        <form action={deleteActionItem}>
          <input type="hidden" name="meetingId" value={meetingId} />
          <input type="hidden" name="id" value={item.id} />
          <Button type="submit" variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600" aria-label={`Remover: ${item.content}`}><Trash2 /></Button>
        </form>
      </div>
    </li>
  );
}

function AddForm({ meetingId }: { meetingId: string }) {
  const { pending, error, submit } = useEditAction(addActionItem);

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
      <Input name="content" placeholder="Novo encaminhamento" disabled={pending} />
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input name="assignee" placeholder="Responsável" disabled={pending} />
        <Input name="due_date" type="date" aria-label="Prazo" disabled={pending} />
        <Button type="submit" variant="outline" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Plus />} Adicionar</Button>
      </div>
      {error ? <p role="alert" className="text-sm text-amber-800">{error}</p> : null}
    </form>
  );
}
