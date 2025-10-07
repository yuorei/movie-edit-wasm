import React, { ChangeEvent } from 'react';
import { BgmTrack, Clip, ImageOverlay } from '../types';

interface MediaLibraryProps {
  clips: Clip[];
  bgmTracks: BgmTrack[];
  imageOverlays: ImageOverlay[];
  onImportVideo: (files: FileList | null) => void;
  onImportAudio: (files: FileList | null) => void;
  onImportImage: (files: FileList | null) => void;
  onSelectClip: (id: string) => void;
  onRemoveClip: (id: string) => void;
  onRemoveBgm: (id: string) => void;
  onRemoveImageOverlay: (id: string) => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  clips,
  bgmTracks,
  imageOverlays,
  onImportVideo,
  onImportAudio,
  onImportImage,
  onSelectClip,
  onRemoveClip,
  onRemoveBgm,
  onRemoveImageOverlay
}) => {
  const handleImportVideo = (event: ChangeEvent<HTMLInputElement>) => {
    onImportVideo(event.target.files);
    event.target.value = '';
  };
  const handleImportAudio = (event: ChangeEvent<HTMLInputElement>) => {
    onImportAudio(event.target.files);
    event.target.value = '';
  };
  const handleImportImage = (event: ChangeEvent<HTMLInputElement>) => {
    onImportImage(event.target.files);
    event.target.value = '';
  };

  return (
    <section className="panel">
      <h2>メディアライブラリ</h2>
      <div className="form-group">
        <label htmlFor="video-upload">動画を追加</label>
        <input id="video-upload" type="file" accept="video/*" onChange={handleImportVideo} multiple />
      </div>
      <div className="form-group">
        <label htmlFor="audio-upload">BGM を追加</label>
        <input id="audio-upload" type="file" accept="audio/*" onChange={handleImportAudio} multiple />
      </div>
      <div className="form-group">
        <label htmlFor="image-upload">ロゴ・透かしを追加</label>
        <input id="image-upload" type="file" accept="image/*" onChange={handleImportImage} multiple />
      </div>
      <h3 className="timeline-label">動画クリップ</h3>
      <div className="media-list">
        {clips.map((clip) => (
          <div className="media-item" key={clip.id}>
            <span>{clip.label}</span>
            <div>
              <button type="button" onClick={() => onSelectClip(clip.id)}>
                編集
              </button>
              <button className="secondary-button" type="button" onClick={() => onRemoveClip(clip.id)}>
                削除
              </button>
            </div>
          </div>
        ))}
        {!clips.length && <span>まだクリップがありません。</span>}
      </div>
      <h3 className="timeline-label">BGM トラック</h3>
      <div className="media-list">
        {bgmTracks.map((track) => (
          <div className="media-item" key={track.id}>
            <span>{track.label}</span>
            <button className="secondary-button" type="button" onClick={() => onRemoveBgm(track.id)}>
              削除
            </button>
          </div>
        ))}
        {!bgmTracks.length && <span>BGM は未設定です。</span>}
      </div>
      <h3 className="timeline-label">画像オーバーレイ</h3>
      <div className="media-list">
        {imageOverlays.map((overlay) => (
          <div className="media-item" key={overlay.id}>
            <span>{overlay.label}</span>
            <button className="secondary-button" type="button" onClick={() => onRemoveImageOverlay(overlay.id)}>
              削除
            </button>
          </div>
        ))}
        {!imageOverlays.length && <span>ロゴ・透かしは未設定です。</span>}
      </div>
    </section>
  );
};

export default MediaLibrary;
