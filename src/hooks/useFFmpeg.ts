import { useCallback, useEffect, useMemo, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';

type LogMessage = { type: string; message: string };

export const useFFmpeg = () => {
  const ffmpeg = useMemo(() => new FFmpeg(), []);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  useEffect(() => {
    const handleProgress = ({ ratio }: { ratio: number }) => {
      setProgress(Math.min(Math.max(ratio * 100, 0), 100));
    };
    const handleLog = ({ type, message }: { type: string; message: string }) => {
      setLogs((prev) => [...prev.slice(-100), { type, message }]);
    };

    ffmpeg.on('progress', handleProgress);
    ffmpeg.on('log', handleLog);

    return () => {
      ffmpeg.off('progress', handleProgress);
      ffmpeg.off('log', handleLog);
    };
  }, [ffmpeg]);

  const load = useCallback(async () => {
    if (loaded || loading) {
      return;
    }
    try {
      setLoading(true);
      await ffmpeg.load();
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [ffmpeg, loaded, loading]);

  return { ffmpeg, load, loaded, loading, progress, logs };
};
