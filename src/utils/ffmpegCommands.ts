import { AspectRatioPreset, Clip, ImageOverlay } from '../types';

export const aspectDimensions: Record<Exclude<AspectRatioPreset, 'original'>, { width: number; height: number }> = {
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '4:5': { width: 1080, height: 1350 }
};

export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) {
    return '0:00';
  }
  const sign = seconds < 0 ? '-' : '';
  const value = Math.max(Math.abs(seconds), 0);
  const minutes = Math.floor(value / 60);
  const secs = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${sign}${minutes}:${secs}`;
};

export const buildVideoFilterForClip = (clip: Clip): string | null => {
  const filters: string[] = [];

  if (clip.cropEnabled) {
    filters.push(
      `crop=${Math.max(1, Math.floor(clip.cropWidth))}:${Math.max(1, Math.floor(clip.cropHeight))}:${Math.max(0, Math.floor(clip.cropX))}:${Math.max(0, Math.floor(clip.cropY))}`
    );
  }

  if (clip.flipHorizontal) {
    filters.push('hflip');
  }

  switch (clip.rotate) {
    case 90:
      filters.push('transpose=1');
      break;
    case 180:
      filters.push('transpose=1', 'transpose=1');
      break;
    case 270:
      filters.push('transpose=2');
      break;
    default:
      break;
  }

  if (clip.fadeIn > 0) {
    filters.push(`fade=t=in:st=0:d=${clip.fadeIn.toFixed(3)}`);
  }
  const trimmedDuration = Math.max(clip.trimEnd - clip.trimStart, 0);
  if (clip.fadeOut > 0 && trimmedDuration > clip.fadeOut) {
    const start = trimmedDuration - clip.fadeOut;
    filters.push(`fade=t=out:st=${start.toFixed(3)}:d=${clip.fadeOut.toFixed(3)}`);
  }

  if (clip.playbackRate !== 1) {
    const factor = 1 / clip.playbackRate;
    filters.push(`setpts=${factor.toFixed(5)}*PTS`);
  }

  return filters.length ? filters.join(',') : null;
};

const buildAtempoChain = (rate: number): string[] => {
  const filters: string[] = [];
  let remaining = rate;
  while (remaining > 2.0) {
    filters.push('atempo=2.0');
    remaining /= 2.0;
  }
  while (remaining < 0.5) {
    filters.push('atempo=0.5');
    remaining /= 0.5;
  }
  filters.push(`atempo=${remaining.toFixed(5)}`);
  return filters;
};

export const buildAudioFilterForClip = (clip: Clip): string | null => {
  const filters: string[] = [];

  if (clip.mute) {
    filters.push('volume=0');
  } else if (clip.volume !== 1) {
    filters.push(`volume=${clip.volume.toFixed(3)}`);
  }

  if (clip.fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${clip.fadeIn.toFixed(3)}`);
  }
  const trimmedDuration = Math.max(clip.trimEnd - clip.trimStart, 0);
  if (clip.fadeOut > 0 && trimmedDuration > clip.fadeOut) {
    const start = trimmedDuration - clip.fadeOut;
    filters.push(`afade=t=out:st=${start.toFixed(3)}:d=${clip.fadeOut.toFixed(3)}`);
  }

  if (clip.playbackRate !== 1) {
    filters.push(...buildAtempoChain(clip.playbackRate));
  }

  return filters.length ? filters.join(',') : null;
};

export const createConcatFileContent = (files: string[]): Uint8Array => {
  const encoder = new TextEncoder();
  const content = files.map((file) => `file '${file}'`).join('\n');
  return encoder.encode(content);
};

interface OverlayGraphOptions {
  baseLabel: string;
  aspect: AspectRatioPreset;
  imageOverlays: Array<{
    overlay: Pick<ImageOverlay, 'x' | 'y' | 'width' | 'height' | 'start' | 'end' | 'opacity'>;
    streamLabel: string;
  }>;
}

export const buildOverlayFilterGraph = ({
  baseLabel,
  aspect,
  imageOverlays
}: OverlayGraphOptions): { filter: string | null; outputLabel: string } => {
  let currentLabel = baseLabel;
  const filters: string[] = [];
  let labelIndex = 0;

  if (aspect !== 'original') {
    const dims = aspectDimensions[aspect];
    const next = `v${labelIndex++}`;
    filters.push(
      `[${currentLabel}]scale=${dims.width}:${dims.height}:force_original_aspect_ratio=increase,crop=${dims.width}:${dims.height}[${next}]`
    );
    currentLabel = next;
  }

  imageOverlays.forEach(({ overlay, streamLabel }) => {
    const next = `v${labelIndex++}`;
    const scaled = `img${labelIndex}`;
    filters.push(
      `[${streamLabel}]scale=${Math.max(1, Math.floor(overlay.width))}:${Math.max(1, Math.floor(overlay.height))},format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='a(X,Y)*${overlay.opacity.toFixed(2)}'[${scaled}]`
    );
    filters.push(
      `[${currentLabel}][${scaled}]overlay=${overlay.x}:${overlay.y}:enable='between(t,${overlay.start},${overlay.end})'[${next}]`
    );
    currentLabel = next;
  });

  return { filter: filters.length ? filters.join(';') : null, outputLabel: currentLabel };
};
