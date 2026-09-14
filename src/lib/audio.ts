/** Tipos aceitos pelo bucket `meeting-audios` e pela transcrição da Groq. */
const EXTENSION_BY_TYPE: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
};

/** Aliases que os navegadores usam para os mesmos formatos. */
const CANONICAL_TYPE: Record<string, string> = {
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/mp3": "audio/mpeg",
  "audio/x-flac": "audio/flac",
};

export const ACCEPTED_MIME_TYPES = Object.keys(EXTENSION_BY_TYPE);

/**
 * Limite de tamanho por áudio, em MB. A Groq aceita 25 MB no plano gratuito e
 * 100 MB no plano dev, então o teto vem do ambiente em vez de ficar no código.
 * O bucket do Supabase é o limite físico e fica no máximo suportado.
 */
export const MAX_AUDIO_MB = (() => {
  const configured = Number(process.env.NEXT_PUBLIC_MAX_AUDIO_MB);
  if (!Number.isFinite(configured) || configured <= 0) return 25;
  return Math.min(100, Math.floor(configured));
})();

export const MAX_AUDIO_BYTES = MAX_AUDIO_MB * 1024 * 1024;

/** Remove parâmetros como `;codecs=opus` e normaliza aliases do navegador. */
export function baseMimeType(type: string) {
  const base = type.split(";")[0].trim().toLowerCase();
  return CANONICAL_TYPE[base] ?? base;
}

export function isAcceptedAudio(type: string) {
  return ACCEPTED_MIME_TYPES.includes(baseMimeType(type));
}

/**
 * A extensão vem sempre do tipo do arquivo, nunca do nome enviado: um arquivo
 * sem ponto no nome produziria um caminho como `uuid.minha-gravacao`.
 */
export function extensionFor(type: string) {
  return EXTENSION_BY_TYPE[baseMimeType(type)] ?? "webm";
}
