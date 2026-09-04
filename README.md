# Memória de Reunião
Aplicativo para centralizar reuniões, participantes, decisões e próximos passos. Construído com Next.js, Vercel e Supabase.

## Rodando localmente
1. Copie `.env.example` para `.env.local`.
2. Crie um projeto Supabase e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Crie uma chave Groq e preencha `GROQ_API_KEY`.
4. Execute `supabase/schema.sql` no SQL Editor do Supabase.
5. Rode `pnpm dev`.

Sem as variáveis, a página inicial abre em modo demonstrativo; autenticação informa que a configuração é necessária.

## Deploy
Importe o repositório na Vercel e cadastre `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `GROQ_API_KEY` em Settings → Environment Variables para Development, Preview e Production. O `.env.local` é somente local e nunca é enviado à Vercel ou ao GitHub. Consulte `PROJECT_STATUS.md` para o fluxo completo e a vistoria atualizada.
