/** Tipos aceitos pelo bucket `meeting-audios` e pela transcrição. */
const EXTENSION_BY_TYPE: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

/** Aliases que os navegadores usam para os mesmos formatos. */
const CANONICAL_TYPE: Record<string, string> = {
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/mp3": "audio/mpeg",
};

export const ACCEPTED_MIME_TYPES = Object.keys(EXTENSION_BY_TYPE);
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

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
