"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
function credentials(formData: FormData) { return { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") }; }
function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
async function applicationOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}
export async function login(formData: FormData) { if (!configured()) redirect("/login?message=Configure+as+variáveis+do+Supabase+para+entrar"); const supabase = await createClient(); const { error } = await supabase.auth.signInWithPassword(credentials(formData)); if (error) redirect(`/login?message=${encodeURIComponent(error.message)}`); redirect("/"); }
export async function signup(formData: FormData) { if (!configured()) redirect("/login?message=Configure+as+variáveis+do+Supabase+para+criar+a+conta"); const supabase = await createClient(); const { error } = await supabase.auth.signUp({ ...credentials(formData), options: { emailRedirectTo: `${await applicationOrigin()}/auth/callback` } }); if (error) redirect(`/login?message=${encodeURIComponent(error.message)}`); redirect("/login?message=Confira+seu+e-mail+para+confirmar+a+conta"); }
