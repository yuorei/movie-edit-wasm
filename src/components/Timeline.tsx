import React from 'react';
import { Clip } from '../types';
import { formatTime } from '../utils/ffmpegCommands';

interface TimelineProps {
  clips: Clip[];
  selectedClipId: string | null;
  onSelectClip: (id: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ clips, selectedClipId, onSelectClip }) => {
  const totalDuration = clips.reduce((acc, clip) => acc + Math.max(clip.trimEnd - clip.trimStart, 0) / clip.playbackRate, 0);

  return (
    <section className="panel timeline">
      <h2>タイムライン</h2>
      <span className="timeline-label">映像トラック</span>
      <div className="timeline-track">
        {clips.map((clip) => {
          const length = Math.max(clip.trimEnd - clip.trimStart, 0) / clip.playbackRate;
          const width = totalDuration ? Math.max((length / totalDuration) * 100, 10) : 100;
          return (
            <div
              key={clip.id}
              className={`timeline-clip${selectedClipId === clip.id ? ' active' : ''}`}
              style={{ flexBasis: `${width}%`, flexGrow: width, flexShrink: 0 }}
              onClick={() => onSelectClip(clip.id)}
            >
              <strong>{clip.label}</strong>
              <span>尺: {formatTime(length)}</span>
              <span>速度: {clip.playbackRate.toFixed(2)}x</span>
            </div>
          );
        })}
        {!clips.length && <span>クリップを追加してください。</span>}
      </div>
    </section>
  );
};

export default Timeline;
