# Memória de Reunião

Aplicativo para centralizar reuniões, participantes, decisões e próximos passos. Grave pelo navegador ou envie um arquivo de áudio: a transcrição e a memória executiva são geradas em nuvem e ficam vinculadas apenas à sua conta. Construído com Next.js, Vercel e Supabase.

## Rodando localmente

1. Copie `.env.example` para `.env.local`.
2. Crie um projeto Supabase e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Crie uma chave Groq e preencha `GROQ_API_KEY`.
4. Execute `supabase/schema.sql` no SQL Editor do Supabase. O arquivo é idempotente e pode ser reexecutado sempre que o schema mudar.
5. Rode `pnpm dev`.

As três primeiras variáveis são obrigatórias: sem elas o aplicativo não consegue autenticar nem processar áudio. `NEXT_PUBLIC_SITE_URL` é opcional e serve para fixar o endereço usado no link de confirmação de e-mail.

## Como o fluxo funciona

1. O áudio é enviado para o bucket privado `meeting-audios`, em uma pasta por usuário.
2. A rota `POST /api/meetings/[id]/process` transcreve com Whisper na Groq e organiza a memória executiva.
3. A página da reunião acompanha o andamento e se atualiza sozinha até concluir.
4. Se o processamento falhar ou for interrompido (aba fechada, tempo limite da função), a mesma página oferece **Processar novamente**. Reprocessar substitui a memória anterior em vez de duplicá-la.

O processamento roda dentro da requisição, com limite de 60 segundos na Vercel. Áudios longos podem estourar esse limite e precisar de nova tentativa — uma fila assíncrona ainda está pendente, conforme `PROJECT_STATUS.md`.

## Limites atuais

- Formatos aceitos: MP3, M4A, WAV, FLAC, WebM e OGG.
- Tamanho máximo por áudio: **25 MB** por padrão, que é o teto da Groq no plano gratuito. No plano dev o teto é 100 MB: defina `NEXT_PUBLIC_MAX_AUDIO_MB=100` e faça um novo deploy. O bucket já aceita 100 MB, então não é preciso reexecutar o schema.
- A transcrição reduz todo áudio a **16 kHz mono** antes de processar. Gravar ou enviar acima disso não melhora o resultado, só gasta o limite de tamanho.
- Por isso a gravação pelo navegador usa mono a 32 kbps. Medido em Chromium: o padrão anterior de 128 kbps cabia cerca de 30 minutos em 25 MB; a 32 kbps cabem algumas horas.
- Arquivo grande demais? Converta antes de enviar, sem perda prática para a transcrição:

  ```sh
  ffmpeg -i entrada.mp3 -ar 16000 -ac 1 -c:a flac saida.flac
  ```

- O tamanho não é o único teto: o processamento roda dentro de uma requisição limitada a 60 segundos na Vercel. Reuniões muito longas podem estourar esse tempo e precisar de nova tentativa até a fila assíncrona existir.

## Deploy

Importe o repositório na Vercel e cadastre `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `GROQ_API_KEY` em Settings → Environment Variables para Development, Preview e Production. O `.env.local` é somente local e nunca é enviado à Vercel ou ao GitHub. Consulte `PROJECT_STATUS.md` para o fluxo completo e a vistoria atualizada.
