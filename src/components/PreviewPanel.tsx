import React, { useEffect, useMemo } from 'react';
import { AspectRatioPreset, Clip } from '../types';
import { aspectDimensions, formatTime } from '../utils/ffmpegCommands';

interface PreviewPanelProps {
  selectedClip: Clip | null;
  aspect: AspectRatioPreset;
  onAspectChange: (preset: AspectRatioPreset) => void;
}

const aspectOptions: { label: string; value: AspectRatioPreset }[] = [
  { label: 'オリジナル', value: 'original' },
  { label: '1:1', value: '1:1' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '4:5', value: '4:5' }
];

const PreviewPanel: React.FC<PreviewPanelProps> = ({ selectedClip, aspect, onAspectChange }) => {
  const clipUrl = useMemo(() => {
    if (!selectedClip) {
      return undefined;
    }
    return URL.createObjectURL(selectedClip.file);
  }, [selectedClip]);

  useEffect(() => {
    return () => {
      if (clipUrl) {
        URL.revokeObjectURL(clipUrl);
      }
    };
  }, [clipUrl]);

  const aspectStyle = useMemo(() => {
    if (aspect === 'original') {
      return undefined;
    }
    const dims = aspectDimensions[aspect as Exclude<AspectRatioPreset, 'original'>];
    return `${dims.width} / ${dims.height}`;
  }, [aspect]);

  return (
    <section className="panel preview-panel">
      <div>
        <h2>プレビュー</h2>
        <div className="aspect-controls">
          {aspectOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === aspect ? 'primary-button' : 'secondary-button'}
              onClick={() => onAspectChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="preview-container">
        {clipUrl && <video src={clipUrl} controls style={{ aspectRatio: aspectStyle }} preload="metadata" />}
        {!clipUrl && <span>プレビューするクリップを選択してください。</span>}
      </div>
      {selectedClip && (
        <div className="status-bar">
          <div>{selectedClip.label}</div>
          <div>長さ: {formatTime((selectedClip.trimEnd - selectedClip.trimStart) / selectedClip.playbackRate)}</div>
        </div>
      )}
    </section>
  );
};

export default PreviewPanel;
