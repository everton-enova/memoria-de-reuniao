/** Desenho da onda de áudio ao vivo, no estilo das barrinhas de mensagem de voz. */

const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MIN_BAR_HEIGHT = 2;
/** O pico de voz raramente chega a 1; o ganho aproveita melhor a altura disponível. */
const HEIGHT_GAIN = 1.7;

/** Quantas barras cabem na largura informada. */
export function barCapacity(width: number) {
  return Math.max(1, Math.floor(width / (BAR_WIDTH + BAR_GAP)));
}

/** Pico de amplitude (0 a 1) de uma janela do sinal no domínio do tempo. */
export function peakOf(samples: Uint8Array) {
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.abs(samples[index] - 128) / 128;
    if (value > peak) peak = value;
  }
  return peak;
}

/** Reduz o histórico inteiro a `buckets` barras preservando os picos de cada trecho. */
export function downsamplePeaks(levels: number[], buckets: number) {
  if (buckets <= 0) return [];
  if (levels.length <= buckets) return levels.slice();

  const bucketSize = levels.length / buckets;
  const result: number[] = [];
  for (let index = 0; index < buckets; index += 1) {
    const start = Math.floor(index * bucketSize);
    const end = Math.min(levels.length, Math.floor((index + 1) * bucketSize));
    let peak = 0;
    for (let cursor = start; cursor < end; cursor += 1) {
      if (levels[cursor] > peak) peak = levels[cursor];
    }
    result.push(peak);
  }
  return result;
}

/**
 * Desenha as barras centralizadas na vertical. A cor vem do `color` do próprio
 * canvas, então o componente escolhe a cor por classe do Tailwind.
 * Sem níveis, desenha a linha de base que indica "pronto para gravar".
 */
export function drawBars(canvas: HTMLCanvasElement, levels: number[]) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }

  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = getComputedStyle(canvas).color;

  const step = BAR_WIDTH + BAR_GAP;
  const capacity = barCapacity(width);
  const bars = levels.length ? levels.slice(-capacity) : new Array<number>(capacity).fill(0);
  context.globalAlpha = levels.length ? 1 : 0.25;

  const middle = height / 2;
  bars.forEach((level, index) => {
    const barHeight = Math.max(MIN_BAR_HEIGHT, Math.min(height, level * height * HEIGHT_GAIN));
    const x = index * step;
    const y = middle - barHeight / 2;
    context.beginPath();
    if (typeof context.roundRect === "function") {
      context.roundRect(x, y, BAR_WIDTH, barHeight, BAR_WIDTH / 2);
    } else {
      context.rect(x, y, BAR_WIDTH, barHeight);
    }
    context.fill();
  });

  context.globalAlpha = 1;
}
