"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Marca ou desmarca um encaminhamento. A RLS garante que só o dono da reunião altera o item. */
export async function toggleActionItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const completed = String(formData.get("completed") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("action_items").update({ completed: !completed }).eq("id", id);
  revalidatePath("/");
}
