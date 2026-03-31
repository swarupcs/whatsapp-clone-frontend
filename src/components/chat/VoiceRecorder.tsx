import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Send, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (blob: Blob | null) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({
  isRecording,
  onStopRecording,
  onCancel,
}: Props) {
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(30).fill(0.3));

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  // BUG FIX 5: Track whether the component is still mounted when getUserMedia resolves.
  // Without this, an async getUserMedia that resolves after unmount will capture the
  // microphone and never release it.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isRecording) startRec();
    return () => {
      stopRec();
    };
  }, [isRecording]);

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>;
    if (isRecording && !audioBlob) {
      iv = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(iv);
  }, [isRecording, audioBlob]);

  // BUG FIX 5: Cleanup blob URL and audio element on unmount
  useEffect(() => {
    return () => {
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // BUG FIX 5: Check if component is still mounted before using the stream.
      // getUserMedia is async — if the user navigated away while it was resolving,
      // we must immediately release the mic and abort.
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      audioCtxRef.current
        .createMediaStreamSource(stream)
        .connect(analyserRef.current);
      analyserRef.current.fftSize = 64;
      visualise();

      mediaRecRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecRef.current.ondataavailable = (e) =>
        chunksRef.current.push(e.data);
      mediaRecRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (mountedRef.current) setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecRef.current.start();
      setDuration(0);
      setAudioBlob(null);
    } catch {
      if (mountedRef.current) onCancel();
    }
  };

  const stopRec = () => {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
  };

  const visualise = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    const draw = () => {
      if (!analyserRef.current || !mountedRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      setBars(
        Array.from({ length: 30 }, (_, i) =>
          Math.max(0.1, data[Math.floor((i * data.length) / 30)]! / 255),
        ),
      );
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const handleSend = () => {
    stopRec();
    onStopRecording(audioBlob);
    setDuration(0);
    setAudioBlob(null);
    // Revoke blob URL if it was created
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
  };

  const handleCancel = () => {
    stopRec();
    setDuration(0);
    setAudioBlob(null);
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
    onCancel();
  };

  const togglePlay = () => {
    if (!audioBlob) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // BUG FIX 5: Track the blob URL so we can revoke it on cleanup
      if (!audioRef.current) {
        const url = URL.createObjectURL(audioBlob);
        audioBlobUrlRef.current = url;
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!isRecording) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className='absolute inset-x-0 bottom-0 p-4 bg-card border-t border-border z-20'
      >
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleCancel}
            className='text-destructive hover:text-destructive hover:bg-destructive/10'
          >
            <Trash2 className='h-5 w-5' />
          </Button>

          <div className='flex-1 flex items-center justify-center gap-0.5 h-12'>
            {bars.map((h, i) => (
              <motion.div
                key={i}
                className={cn(
                  'w-1 rounded-full',
                  audioBlob ? 'bg-primary' : 'bg-destructive',
                )}
                animate={{ height: `${h * 40}px` }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>

          <div className='flex items-center gap-2 min-w-[60px]'>
            {!audioBlob && (
              <motion.div
                className='w-2 h-2 rounded-full bg-destructive'
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            <span className='text-sm font-mono'>{fmt(duration)}</span>
          </div>

          {audioBlob ? (
            <>
              <Button variant='ghost' size='icon' onClick={togglePlay}>
                {isPlaying ? (
                  <Pause className='h-5 w-5' />
                ) : (
                  <Play className='h-5 w-5' />
                )}
              </Button>
              <Button
                size='icon'
                onClick={handleSend}
                className='gradient-glow rounded-full'
              >
                <Send className='h-4 w-4' />
              </Button>
            </>
          ) : (
            <Button
              size='icon'
              onClick={stopRec}
              className='bg-destructive hover:bg-destructive/90 rounded-full'
            >
              <div className='w-4 h-4 rounded-sm bg-white' />
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
