import { TextOverlay } from '../types';
import { hexToRgba } from './color';

export interface RenderedTextOverlay {
  fileName: string;
  width: number;
  height: number;
  x: number;
  y: number;
  start: number;
  end: number;
  opacity: number;
  data: Uint8Array;
}

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

export const renderTextOverlay = async (overlay: TextOverlay): Promise<RenderedTextOverlay> => {
  const padding = 12;
  const font = `${overlay.fontSize}px Inter, system-ui, sans-serif`;
  const canvas = createCanvas(4, 4);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported in this environment');
  }
  ctx.font = font;
  const metrics = ctx.measureText(overlay.text);
  const width = Math.ceil(metrics.width + padding * 2);
  const height = Math.ceil(overlay.fontSize * 1.6 + padding * 2);
  const renderCanvas = createCanvas(width, height);
  const renderCtx = renderCanvas.getContext('2d');
  if (!renderCtx) {
    throw new Error('Canvas is not supported in this environment');
  }
  renderCtx.clearRect(0, 0, width, height);
  renderCtx.font = font;
  renderCtx.fillStyle = hexToRgba(overlay.color, overlay.opacity);
  renderCtx.textBaseline = 'middle';
  renderCtx.fillText(overlay.text, padding, height / 2);
  const blob: Blob = await new Promise((resolve, reject) => {
    renderCanvas.toBlob((result) => {
      if (!result) {
        reject(new Error('Failed to render overlay text'));
        return;
      }
      resolve(result);
    }, 'image/png');
  });
  const arrayBuffer = await blob.arrayBuffer();
  return {
    fileName: `text-overlay-${overlay.id}.png`,
    width,
    height,
    x: overlay.x,
    y: overlay.y,
    start: overlay.start,
    end: overlay.end,
    opacity: overlay.opacity,
    data: new Uint8Array(arrayBuffer)
  };
};
