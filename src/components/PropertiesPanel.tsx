import React, { ChangeEvent } from 'react';
import { BgmTrack, Clip, ImageOverlay, TextOverlay } from '../types';

interface PropertiesPanelProps {
  selectedClip: Clip | null;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  textOverlays: TextOverlay[];
  onAddTextOverlay: () => void;
  onUpdateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  onRemoveTextOverlay: (id: string) => void;
  imageOverlays: ImageOverlay[];
  onUpdateImageOverlay: (id: string, updates: Partial<ImageOverlay>) => void;
  bgmTracks: BgmTrack[];
  onUpdateBgm: (id: string, updates: Partial<BgmTrack>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedClip,
  onUpdateClip,
  textOverlays,
  onAddTextOverlay,
  onUpdateTextOverlay,
  onRemoveTextOverlay,
  imageOverlays,
  onUpdateImageOverlay,
  bgmTracks,
  onUpdateBgm
}) => {
  const handleClipNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedClip) return;
    const { name, value } = event.target;
    onUpdateClip(selectedClip.id, { [name]: Number(value) } as Partial<Clip>);
  };

  const handleClipCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedClip) return;
    const { name, checked } = event.target;
    onUpdateClip(selectedClip.id, { [name]: checked } as Partial<Clip>);
  };

  const handleClipSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!selectedClip) return;
    const { name, value } = event.target;
    onUpdateClip(selectedClip.id, { [name]: Number(value) } as Partial<Clip>);
  };

  return (
    <section className="panel">
      <h2>プロパティ</h2>
      {!selectedClip && <span>編集するクリップを選択してください。</span>}
      {selectedClip && (
        <div className="properties-form">
          <div className="form-group">
            <label>トリム</label>
            <div className="form-inline">
              <label>
                開始 (秒)
                <input type="number" name="trimStart" min={0} max={selectedClip.duration} step="0.1" value={selectedClip.trimStart}
                  onChange={handleClipNumberChange}
                />
              </label>
              <label>
                終了 (秒)
                <input type="number" name="trimEnd" min={0} max={selectedClip.duration} step="0.1" value={selectedClip.trimEnd}
                  onChange={handleClipNumberChange}
                />
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" name="cropEnabled" checked={selectedClip.cropEnabled} onChange={handleClipCheckboxChange} />
              クロップを有効化
            </label>
            {selectedClip.cropEnabled && (
              <div className="form-inline">
                <label>
                  X
                  <input type="number" name="cropX" value={selectedClip.cropX} step="1" min={0} onChange={handleClipNumberChange} />
                </label>
                <label>
                  Y
                  <input type="number" name="cropY" value={selectedClip.cropY} step="1" min={0} onChange={handleClipNumberChange} />
                </label>
                <label>
                  幅
                  <input type="number" name="cropWidth" value={selectedClip.cropWidth} step="1" min={1} onChange={handleClipNumberChange} />
                </label>
                <label>
                  高さ
                  <input type="number" name="cropHeight" value={selectedClip.cropHeight} step="1" min={1} onChange={handleClipNumberChange} />
                </label>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>回転 / 反転</label>
            <select name="rotate" value={selectedClip.rotate} onChange={handleClipSelectChange}>
              <option value={0}>回転なし</option>
              <option value={90}>90° 回転</option>
              <option value={180}>180° 回転</option>
              <option value={270}>270° 回転</option>
            </select>
            <label>
              <input type="checkbox" name="flipHorizontal" checked={selectedClip.flipHorizontal} onChange={handleClipCheckboxChange} />
              左右反転
            </label>
          </div>
          <div className="form-group">
            <label>再生速度</label>
            <input type="number" name="playbackRate" min={0.5} max={2} step={0.1} value={selectedClip.playbackRate} onChange={handleClipNumberChange} />
          </div>
          <div className="form-group">
            <label>フェード</label>
            <div className="form-inline">
              <label>
                フェードイン (秒)
                <input type="number" name="fadeIn" min={0} max={10} step="0.1" value={selectedClip.fadeIn} onChange={handleClipNumberChange} />
              </label>
              <label>
                フェードアウト (秒)
                <input type="number" name="fadeOut" min={0} max={10} step="0.1" value={selectedClip.fadeOut} onChange={handleClipNumberChange} />
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>音量</label>
            <div className="form-inline">
              <label>
                倍率
                <input type="number" name="volume" min={0} max={2} step={0.05} value={selectedClip.volume} onChange={handleClipNumberChange} />
              </label>
              <label>
                <input type="checkbox" name="mute" checked={selectedClip.mute} onChange={handleClipCheckboxChange} />
                ミュート
              </label>
            </div>
          </div>
        </div>
      )}
      <div className="form-group">
        <label>テキストオーバーレイ</label>
        <button className="primary-button" type="button" onClick={onAddTextOverlay}>
          テキストを追加
        </button>
        <div className="overlay-list">
          {textOverlays.map((overlay) => (
            <div className="overlay-item" key={overlay.id}>
              <strong>{overlay.text || 'テキスト'}</strong>
              <label>
                テキスト
                <input type="text" value={overlay.text} onChange={(event) => onUpdateTextOverlay(overlay.id, { text: event.target.value })} />
              </label>
              <div className="form-inline">
                <label>
                  開始 (秒)
                  <input type="number" value={overlay.start} min={0} step="0.1" onChange={(event) => onUpdateTextOverlay(overlay.id, { start: Number(event.target.value) })} />
                </label>
                <label>
                  終了 (秒)
                  <input type="number" value={overlay.end} min={overlay.start} step="0.1" onChange={(event) => onUpdateTextOverlay(overlay.id, { end: Number(event.target.value) })} />
                </label>
              </div>
              <div className="form-inline">
                <label>
                  X (px)
                  <input type="number" value={overlay.x} step="1" onChange={(event) => onUpdateTextOverlay(overlay.id, { x: Number(event.target.value) })} />
                </label>
                <label>
                  Y (px)
                  <input type="number" value={overlay.y} step="1" onChange={(event) => onUpdateTextOverlay(overlay.id, { y: Number(event.target.value) })} />
                </label>
              </div>
              <div className="form-inline">
                <label>
                  フォントサイズ
                  <input type="number" value={overlay.fontSize} min={12} max={160} onChange={(event) => onUpdateTextOverlay(overlay.id, { fontSize: Number(event.target.value) })} />
                </label>
                <label>
                  透過度
                  <input type="number" value={overlay.opacity} min={0} max={1} step="0.05" onChange={(event) => onUpdateTextOverlay(overlay.id, { opacity: Number(event.target.value) })} />
                </label>
              </div>
              <label>
                色
                <input type="color" value={overlay.color} onChange={(event) => onUpdateTextOverlay(overlay.id, { color: event.target.value })} />
              </label>
              <div className="overlay-actions">
                <button className="secondary-button" type="button" onClick={() => onRemoveTextOverlay(overlay.id)}>
                  削除
                </button>
              </div>
            </div>
          ))}
          {!textOverlays.length && <span>テキストオーバーレイは追加されていません。</span>}
        </div>
      </div>
      <div className="form-group">
        <label>画像オーバーレイ</label>
        <div className="overlay-list">
          {imageOverlays.map((overlay) => (
            <div className="overlay-item" key={overlay.id}>
              <strong>{overlay.label}</strong>
              <div className="form-inline">
                <label>
                  開始 (秒)
                  <input type="number" value={overlay.start} min={0} step="0.1" onChange={(event) => onUpdateImageOverlay(overlay.id, { start: Number(event.target.value) })} />
                </label>
                <label>
                  終了 (秒)
                  <input type="number" value={overlay.end} min={overlay.start} step="0.1" onChange={(event) => onUpdateImageOverlay(overlay.id, { end: Number(event.target.value) })} />
                </label>
              </div>
              <div className="form-inline-3">
                <label>
                  X (px)
                  <input type="number" value={overlay.x} step="1" onChange={(event) => onUpdateImageOverlay(overlay.id, { x: Number(event.target.value) })} />
                </label>
                <label>
                  Y (px)
                  <input type="number" value={overlay.y} step="1" onChange={(event) => onUpdateImageOverlay(overlay.id, { y: Number(event.target.value) })} />
                </label>
                <label>
                  幅 (px)
                  <input type="number" value={overlay.width} min={10} onChange={(event) => onUpdateImageOverlay(overlay.id, { width: Number(event.target.value) })} />
                </label>
                <label>
                  高さ (px)
                  <input type="number" value={overlay.height} min={10} onChange={(event) => onUpdateImageOverlay(overlay.id, { height: Number(event.target.value) })} />
                </label>
              </div>
              <label>
                透過度
                <input type="number" value={overlay.opacity} min={0} max={1} step="0.05" onChange={(event) => onUpdateImageOverlay(overlay.id, { opacity: Number(event.target.value) })} />
              </label>
            </div>
          ))}
          {!imageOverlays.length && <span>画像オーバーレイは追加されていません。</span>}
        </div>
      </div>
      <div className="form-group">
        <label>BGM</label>
        <div className="overlay-list">
          {bgmTracks.map((track) => (
            <div className="overlay-item" key={track.id}>
              <strong>{track.label}</strong>
              <div className="form-inline">
                <label>
                  音量
                  <input type="number" value={track.volume} min={0} max={2} step={0.05} onChange={(event) => onUpdateBgm(track.id, { volume: Number(event.target.value) })} />
                </label>
                <label>
                  オフセット (秒)
                  <input type="number" value={track.offset} min={0} step="0.1" onChange={(event) => onUpdateBgm(track.id, { offset: Number(event.target.value) })} />
                </label>
              </div>
            </div>
          ))}
          {!bgmTracks.length && <span>BGM は未設定です。</span>}
        </div>
      </div>
    </section>
  );
};

export default PropertiesPanel;
