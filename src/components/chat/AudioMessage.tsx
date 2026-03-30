import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioMessageProps {
  audioUrl: string;
  duration?: number;
  isOwn: boolean;
}

export default function AudioMessage({
  audioUrl,
  duration = 0,
  isOwn,
}: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate random waveform data for visual effect
  const waveformBars = useRef(
    Array.from({ length: 35 }, () => 0.2 + Math.random() * 0.8),
  );

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className='flex items-center gap-3 min-w-[200px]'>
      <Button
        variant='ghost'
        size='icon'
        onClick={togglePlayback}
        className={cn(
          'h-10 w-10 rounded-full shrink-0',
          isOwn
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-primary/20 hover:bg-primary/30 text-primary',
        )}
      >
        {isPlaying ? (
          <Pause className='h-5 w-5' />
        ) : (
          <Play className='h-5 w-5 ml-0.5' />
        )}
      </Button>

      <div className='flex-1 space-y-1'>
        {/* Waveform */}
        <div className='flex items-center gap-0.5 h-6'>
          {waveformBars.current.map((height, i) => {
            const barProgress = (i / waveformBars.current.length) * 100;
            const isActive = barProgress <= progress;

            return (
              <motion.div
                key={i}
                className={cn(
                  'w-0.5 rounded-full transition-colors',
                  isActive
                    ? isOwn
                      ? 'bg-white'
                      : 'bg-primary'
                    : isOwn
                      ? 'bg-white/40'
                      : 'bg-muted-foreground/40',
                )}
                style={{ height: `${height * 100}%` }}
                animate={isPlaying && isActive ? { scaleY: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </div>

        {/* Time */}
        <div className='flex justify-between text-[10px] opacity-70'>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}
