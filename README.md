# Memória de Reunião
Aplicativo para centralizar reuniões, participantes, decisões e próximos passos. Construído com Next.js, Vercel e Supabase.

## Rodando localmente
1. Copie `.env.example` para `.env.local`.
2. Crie um projeto Supabase e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Execute `supabase/schema.sql` no SQL Editor do Supabase.
4. Rode `pnpm dev`.

Sem as variáveis, a página inicial abre em modo demonstrativo; autenticação informa que a configuração é necessária.

## Deploy
Importe o repositório na Vercel, instale a integração Supabase pelo Marketplace e disponibilize as duas variáveis nos ambientes Development, Preview e Production. Depois execute o schema uma única vez no projeto Supabase.
