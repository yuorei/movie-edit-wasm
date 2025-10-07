import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import Header from './components/Header';
import MediaLibrary from './components/MediaLibrary';
import PreviewPanel from './components/PreviewPanel';
import Timeline from './components/Timeline';
import PropertiesPanel from './components/PropertiesPanel';
import { useFFmpeg } from './hooks/useFFmpeg';
import {
  AspectRatioPreset,
  BgmTrack,
  Clip,
  ExportStatus,
  ImageOverlay,
  ProjectSettings,
  TextOverlay
} from './types';
import { buildAudioFilterForClip, buildOverlayFilterGraph, buildVideoFilterForClip, createConcatFileContent } from './utils/ffmpegCommands';
import { renderTextOverlay } from './utils/textToImage';

const createEmptyExportStatus = (): ExportStatus => ({
  running: false,
  progress: 0,
  message: ''
});

const getFileExtension = (fileName: string): string => {
  const index = fileName.lastIndexOf('.');
  if (index === -1) {
    return '.dat';
  }
  return fileName.slice(index);
};

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration || 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('動画メタデータを読み込めませんでした'));
    };
  });

const defaultClipValues = (duration: number, file: File): Clip => ({
  id: crypto.randomUUID(),
  label: file.name,
  file,
  duration,
  trimStart: 0,
  trimEnd: duration,
  cropEnabled: false,
  cropX: 0,
  cropY: 0,
  cropWidth: 1920,
  cropHeight: 1080,
  rotate: 0,
  flipHorizontal: false,
  playbackRate: 1,
  fadeIn: 0,
  fadeOut: 0,
  mute: false,
  volume: 1
});

const defaultImageOverlay = (file: File, totalDuration: number): ImageOverlay => ({
  id: crypto.randomUUID(),
  file,
  label: file.name,
  start: 0,
  end: Math.max(totalDuration, 5),
  x: 40,
  y: 40,
  width: 320,
  height: 180,
  opacity: 0.9
});

const defaultTextOverlay = (totalDuration: number): TextOverlay => ({
  id: crypto.randomUUID(),
  text: 'テキストを編集',
  start: 0,
  end: Math.max(totalDuration, 5),
  x: 80,
  y: 80,
  fontSize: 48,
  color: '#ffffff',
  opacity: 1
});

const defaultBgm = (file: File): BgmTrack => ({
  id: crypto.randomUUID(),
  file,
  label: file.name,
  volume: 0.6,
  offset: 0
});

const App: React.FC = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [imageOverlays, setImageOverlays] = useState<ImageOverlay[]>([]);
  const [bgmTracks, setBgmTracks] = useState<BgmTrack[]>([]);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({ aspect: '16:9' });
  const [exportStatus, setExportStatus] = useState<ExportStatus>(createEmptyExportStatus);
  const { ffmpeg, load, loading, progress } = useFFmpeg();

  const updateExportMessage = useCallback((message: string) => {
    setExportStatus((state) => ({ ...state, message }));
  }, [setExportStatus]);

  useEffect(() => {
    if (exportStatus.running) {
      setExportStatus((state) => ({ ...state, progress }));
    }
  }, [progress, exportStatus.running]);

  useEffect(() => {
    return () => {
      if (exportStatus.downloadUrl) {
        URL.revokeObjectURL(exportStatus.downloadUrl);
      }
    };
  }, [exportStatus.downloadUrl]);

  const projectDuration = useMemo(
    () => clips.reduce((acc, clip) => acc + Math.max(clip.trimEnd - clip.trimStart, 0) / clip.playbackRate, 0),
    [clips]
  );

  const selectedClip = useMemo(() => clips.find((clip) => clip.id === selectedClipId) ?? null, [clips, selectedClipId]);

  const resetProject = () => {
    setClips([]);
    setSelectedClipId(null);
    setTextOverlays([]);
    setImageOverlays([]);
    setBgmTracks([]);
    setProjectSettings({ aspect: '16:9' });
    setExportStatus(createEmptyExportStatus());
  };

  const handleImportVideos = async (files: FileList | null) => {
    if (!files) return;
    const newClips: Clip[] = [];
    for (const file of Array.from(files)) {
      try {
        const duration = await getVideoDuration(file);
        newClips.push(defaultClipValues(duration, file));
      } catch (error) {
        console.error(error);
      }
    }
    setClips((prev) => [...prev, ...newClips]);
    if (!selectedClipId && newClips.length) {
      setSelectedClipId(newClips[0].id);
    }
  };

  const handleImportAudio = (files: FileList | null) => {
    if (!files) return;
    const tracks = Array.from(files).map((file) => defaultBgm(file));
    setBgmTracks((prev) => [...prev, ...tracks]);
  };

  const handleImportImages = (files: FileList | null) => {
    if (!files) return;
    const overlays = Array.from(files).map((file) => defaultImageOverlay(file, projectDuration));
    setImageOverlays((prev) => [...prev, ...overlays]);
  };

  const updateClip = (id: string, updates: Partial<Clip>) => {
    setClips((prev) =>
      prev.map((clip) => {
        if (clip.id !== id) return clip;
        const next: Clip = { ...clip, ...updates };
        if (next.trimEnd < next.trimStart) {
          next.trimEnd = next.trimStart;
        }
        if (next.trimEnd > clip.duration) {
          next.trimEnd = clip.duration;
        }
        if (next.trimStart < 0) {
          next.trimStart = 0;
        }
        return next;
      })
    );
  };

  const removeClip = (id: string) => {
    setClips((prev) => prev.filter((clip) => clip.id !== id));
    if (selectedClipId === id) {
      setSelectedClipId(null);
    }
  };

  const addTextOverlay = () => {
    setTextOverlays((prev) => [...prev, defaultTextOverlay(projectDuration)]);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays((prev) =>
      prev.map((overlay) => {
        if (overlay.id !== id) return overlay;
        const next: TextOverlay = { ...overlay, ...updates };
        const start = Number.isFinite(next.start) ? next.start : overlay.start;
        const end = Number.isFinite(next.end) ? next.end : overlay.end;
        next.start = Math.max(start, 0);
        next.end = Math.max(end, 0);
        if (next.end < next.start) {
          next.end = next.start;
        }
        const opacity = Number.isFinite(next.opacity) ? next.opacity : overlay.opacity;
        next.opacity = Math.min(Math.max(opacity, 0), 1);
        return next;
      })
    );
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  };

  const updateImageOverlay = (id: string, updates: Partial<ImageOverlay>) => {
    setImageOverlays((prev) =>
      prev.map((overlay) => {
        if (overlay.id !== id) return overlay;
        const next: ImageOverlay = { ...overlay, ...updates };
        const width = Number.isFinite(next.width) ? next.width : overlay.width;
        const height = Number.isFinite(next.height) ? next.height : overlay.height;
        const start = Number.isFinite(next.start) ? next.start : overlay.start;
        const end = Number.isFinite(next.end) ? next.end : overlay.end;
        const opacity = Number.isFinite(next.opacity) ? next.opacity : overlay.opacity;
        next.width = Math.max(width, 1);
        next.height = Math.max(height, 1);
        next.start = Math.max(start, 0);
        next.end = Math.max(end, 0);
        if (next.end < next.start) {
          next.end = next.start;
        }
        next.opacity = Math.min(Math.max(opacity, 0), 1);
        return next;
      })
    );
  };

  const removeImageOverlay = (id: string) => {
    setImageOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  };

  const updateBgm = (id: string, updates: Partial<BgmTrack>) => {
    setBgmTracks((prev) =>
      prev.map((track) => {
        if (track.id !== id) return track;
        const next: BgmTrack = { ...track, ...updates };
        const volume = Number.isFinite(next.volume) ? next.volume : track.volume;
        const offset = Number.isFinite(next.offset) ? next.offset : track.offset;
        next.volume = Math.max(volume, 0);
        next.offset = Math.max(offset, 0);
        return next;
      })
    );
  };

  const removeBgm = (id: string) => {
    setBgmTracks((prev) => prev.filter((track) => track.id !== id));
  };

  const handleAspectChange = (aspect: AspectRatioPreset) => {
    setProjectSettings((prev) => ({ ...prev, aspect }));
  };

  const handleExport = async () => {
    if (!clips.length) {
      setExportStatus({ running: false, progress: 0, message: '', error: '書き出すクリップがありません。' });
      return;
    }
    try {
      setExportStatus({ running: true, progress: 0, message: 'FFmpeg を読み込み中…' });
      await load();
      setExportStatus({ running: true, progress: 0, message: 'メディアを準備しています…' });

      const videoEncodeArgs = ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-deadline', 'realtime', '-cpu-used', '8', '-pix_fmt', 'yuv420p'];
      const audioEncodeArgs = ['-c:a', 'libopus', '-b:a', '128k'];

      const processedClips: string[] = [];
      let clipIndex = 0;
      for (const clip of clips) {
        const inputName = `clip-source-${clipIndex}${getFileExtension(clip.file.name)}`;
        await ffmpeg.writeFile(inputName, await fetchFile(clip.file));
        const outputName = `clip-rendered-${clipIndex}.webm`;
        const args: string[] = ['-y'];
        const clipDuration = Math.max(clip.trimEnd - clip.trimStart, 0);
        if (clipDuration <= 0.01) {
          clipIndex += 1;
          continue;
        }
        updateExportMessage(`クリップ ${clipIndex + 1}/${clips.length} を処理中…`);
        if (clip.trimStart > 0) {
          args.push('-ss', clip.trimStart.toFixed(3));
        }
        args.push('-t', clipDuration.toFixed(3));
        args.push('-i', inputName);
        const videoFilter = buildVideoFilterForClip(clip);
        if (videoFilter) {
          args.push('-vf', videoFilter);
        }
        const audioFilter = buildAudioFilterForClip(clip);
        if (audioFilter) {
          args.push('-af', audioFilter);
        }
        args.push(...videoEncodeArgs, ...audioEncodeArgs, outputName);
        await ffmpeg.exec(args);
        processedClips.push(outputName);
        clipIndex += 1;
        try {
          await ffmpeg.deleteFile(inputName);
        } catch (error) {
          console.warn('Failed to delete source clip', error);
        }
      }

      if (!processedClips.length) {
        throw new Error('有効な長さのクリップが存在しません。');
      }

      let mergedVideo = processedClips[0];
      if (processedClips.length > 1) {
        const concatFile = 'concat.txt';
        await ffmpeg.writeFile(concatFile, createConcatFileContent(processedClips));
        mergedVideo = 'timeline-merged.webm';
        updateExportMessage('タイムラインを結合しています…');
        await ffmpeg.exec(['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', mergedVideo]);
        try {
          await ffmpeg.deleteFile(concatFile);
        } catch (error) {
          console.warn('Failed to delete concat descriptor', error);
        }
        await Promise.all(
          processedClips.map(async (file) => {
            if (file !== mergedVideo) {
              try {
                await ffmpeg.deleteFile(file);
              } catch (error) {
                console.warn('Failed to delete intermediate clip', error);
              }
            }
          })
        );
      }

      const overlayInputs: string[] = ['-i', mergedVideo];
      const overlayStreams: Array<{
        fileName: string;
        data: Uint8Array;
        x: number;
        y: number;
        start: number;
        end: number;
        width: number;
        height: number;
        opacity: number;
      }> = [];

      if (imageOverlays.length || textOverlays.length) {
        updateExportMessage('オーバーレイ素材を準備しています…');
      }

      for (const overlay of imageOverlays) {
        const fileName = `overlay-image-${overlay.id}${getFileExtension(overlay.file.name)}`;
        overlayStreams.push({
          fileName,
          data: await fetchFile(overlay.file),
          x: overlay.x,
          y: overlay.y,
          start: overlay.start,
          end: overlay.end,
          width: overlay.width,
          height: overlay.height,
          opacity: overlay.opacity
        });
      }

      for (const overlay of textOverlays) {
        const rendered = await renderTextOverlay(overlay);
        overlayStreams.push({
          fileName: rendered.fileName,
          data: rendered.data,
          x: rendered.x,
          y: rendered.y,
          start: rendered.start,
          end: rendered.end,
          width: rendered.width,
          height: rendered.height,
          opacity: rendered.opacity
        });
      }

      let streamIndex = 1;
      const overlayFilterInputs: Array<{
        overlay: {
          x: number;
          y: number;
          width: number;
          height: number;
          start: number;
          end: number;
          opacity: number;
        };
        streamLabel: string;
      }> = [];

      for (const stream of overlayStreams) {
        await ffmpeg.writeFile(stream.fileName, stream.data);
        overlayInputs.push('-i', stream.fileName);
        overlayFilterInputs.push({
          overlay: {
            x: stream.x,
            y: stream.y,
            width: stream.width,
            height: stream.height,
            start: stream.start,
            end: stream.end,
            opacity: stream.opacity
          },
          streamLabel: `${streamIndex}:v`
        });
        streamIndex += 1;
      }

      const audioFilters: string[] = [];
      const mixInputLabels: string[] = [];
      const bgmFileNames: string[] = [];

      if (bgmTracks.length) {
        updateExportMessage('BGM を準備しています…');
        audioFilters.push('[0:a]volume=1[a0]');
        mixInputLabels.push('[a0]');
      }

      let audioInputIndex = 1 + overlayStreams.length;
      for (const track of bgmTracks) {
        const fileName = `bgm-${track.id}${getFileExtension(track.file.name)}`;
        await ffmpeg.writeFile(fileName, await fetchFile(track.file));
        overlayInputs.push('-i', fileName);
        bgmFileNames.push(fileName);
        const delay = Math.max(track.offset * 1000, 0);
        const label = `bgm${audioInputIndex}`;
        audioFilters.push(
          `[${audioInputIndex}:a]adelay=${delay}|${delay},volume=${track.volume.toFixed(3)}[${label}]`
        );
        mixInputLabels.push(`[${label}]`);
        audioInputIndex += 1;
      }

      const overlayFilter = buildOverlayFilterGraph({
        baseLabel: '0:v',
        aspect: projectSettings.aspect,
        imageOverlays: overlayFilterInputs
      });

      let filterComplexParts: string[] = [];
      if (overlayFilter.filter) {
        filterComplexParts.push(overlayFilter.filter);
      }

      if (mixInputLabels.length) {
        filterComplexParts = [...filterComplexParts, ...audioFilters];
        const inputsCount = mixInputLabels.length;
        filterComplexParts.push(`${mixInputLabels.join('')}amix=inputs=${inputsCount}:normalize=0:duration=longest[mixa]`);
      }

      const finalOutput = 'exported-video.webm';
      const exportArgs = ['-y', ...overlayInputs];

      const needsFilter = filterComplexParts.length > 0;
      const needsVideoEncode = Boolean(overlayFilter.filter);
      const needsAudioEncode = mixInputLabels.length > 0;

      if (needsFilter) {
        updateExportMessage('オーバーレイとオーディオを適用しています…');
        exportArgs.push('-filter_complex', filterComplexParts.join(';'));
        exportArgs.push('-map', overlayFilter.outputLabel);
        exportArgs.push('-map', needsAudioEncode ? '[mixa]' : '0:a?');
        if (needsVideoEncode) {
          exportArgs.push(...videoEncodeArgs);
        } else {
          exportArgs.push('-c:v', 'copy');
        }
        if (needsAudioEncode) {
          exportArgs.push(...audioEncodeArgs);
        } else {
          exportArgs.push('-c:a', 'copy');
        }
      } else {
        exportArgs.push('-c', 'copy');
      }

      exportArgs.push(finalOutput);

      updateExportMessage('書き出しを実行しています…');
      await ffmpeg.exec(exportArgs);
      await Promise.all(
        overlayStreams.map(async (stream) => {
          try {
            await ffmpeg.deleteFile(stream.fileName);
          } catch (error) {
            console.warn('Failed to clean overlay asset', error);
          }
        })
      );
      await Promise.all(
        bgmFileNames.map(async (fileName) => {
          try {
            await ffmpeg.deleteFile(fileName);
          } catch (error) {
            console.warn('Failed to delete BGM asset', error);
          }
        })
      );
      const data = await ffmpeg.readFile(finalOutput);
      const blob = new Blob([data], { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setExportStatus({ running: false, progress: 100, message: '書き出し完了', downloadUrl: url });
      try {
        await ffmpeg.deleteFile(finalOutput);
      } catch (error) {
        console.warn('Failed to delete final output', error);
      }
      try {
        await ffmpeg.deleteFile(mergedVideo);
      } catch (error) {
        console.warn('Failed to delete merged video', error);
      }
    } catch (error) {
      console.error(error);
      setExportStatus({ running: false, progress: 0, message: '', error: error instanceof Error ? error.message : '書き出しに失敗しました。' });
    }
  };

  return (
    <div className="app-shell">
      <Header onNewProject={resetProject} onExport={handleExport} exporting={exportStatus.running || loading} />
      <main className="main-layout">
        <MediaLibrary
          clips={clips}
          bgmTracks={bgmTracks}
          imageOverlays={imageOverlays}
          onImportVideo={handleImportVideos}
          onImportAudio={handleImportAudio}
          onImportImage={handleImportImages}
          onSelectClip={(id) => setSelectedClipId(id)}
          onRemoveClip={removeClip}
          onRemoveBgm={removeBgm}
          onRemoveImageOverlay={removeImageOverlay}
        />
        <PreviewPanel selectedClip={selectedClip} aspect={projectSettings.aspect} onAspectChange={handleAspectChange} />
        <PropertiesPanel
          selectedClip={selectedClip}
          onUpdateClip={updateClip}
          textOverlays={textOverlays}
          onAddTextOverlay={addTextOverlay}
          onUpdateTextOverlay={updateTextOverlay}
          onRemoveTextOverlay={removeTextOverlay}
          imageOverlays={imageOverlays}
          onUpdateImageOverlay={updateImageOverlay}
          bgmTracks={bgmTracks}
          onUpdateBgm={updateBgm}
        />
        <Timeline clips={clips} selectedClipId={selectedClipId} onSelectClip={(id) => setSelectedClipId(id)} />
        {exportStatus.running && (
          <div className="status-bar">
            <div>{exportStatus.message}</div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${exportStatus.progress.toFixed(0)}%` }} />
            </div>
          </div>
        )}
        {!exportStatus.running && exportStatus.downloadUrl && (
          <div className="status-bar">
            <div>{exportStatus.message}</div>
            <a className="primary-button" href={exportStatus.downloadUrl} download="edited-video.webm">
              ダウンロード
            </a>
          </div>
        )}
        {!exportStatus.running && exportStatus.error && (
          <div className="status-bar">
            <div className="badge error">エラー</div>
            <div>{exportStatus.error}</div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
