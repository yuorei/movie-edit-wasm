export type AspectRatioPreset = 'original' | '1:1' | '9:16' | '16:9' | '4:5';

export interface Clip {
  id: string;
  label: string;
  file: File;
  duration: number;
  trimStart: number;
  trimEnd: number;
  cropEnabled: boolean;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  rotate: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  playbackRate: number;
  fadeIn: number;
  fadeOut: number;
  mute: boolean;
  volume: number;
}

export interface TimelineState {
  clips: Clip[];
  selectedClipId: string | null;
}

export interface TextOverlay {
  id: string;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  opacity: number;
}

export interface ImageOverlay {
  id: string;
  file: File;
  label: string;
  start: number;
  end: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

export interface BgmTrack {
  id: string;
  file: File;
  label: string;
  volume: number;
  offset: number;
}

export interface ExportStatus {
  running: boolean;
  progress: number;
  message: string;
  downloadUrl?: string;
  error?: string;
}

export interface ProjectSettings {
  aspect: AspectRatioPreset;
  previewUrl?: string;
}
