import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Send, Pause, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (blob: Blob | null) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({
  isRecording,
  onStartRecording,
  onStopRecording,
  onCancel,
}: VoiceRecorderProps) {
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(Array(30).fill(0.3));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    }
    
    return () => {
      stopRecording();
    };
  }, [isRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !audioBlob) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, audioBlob]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 64;
      
      // Start visualization
      visualize();
      
      // Setup MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setDuration(0);
      setAudioBlob(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const draw = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Convert to normalized values
      const bars = Array.from({ length: 30 }, (_, i) => {
        const index = Math.floor(i * dataArray.length / 30);
        return Math.max(0.1, dataArray[index] / 255);
      });
      
      setWaveformData(bars);
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  const handleSend = () => {
    stopRecording();
    onStopRecording(audioBlob);
    setDuration(0);
    setAudioBlob(null);
  };

  const handleCancel = () => {
    stopRecording();
    setDuration(0);
    setAudioBlob(null);
    onCancel();
  };

  const togglePlayback = () => {
    if (!audioBlob) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(URL.createObjectURL(audioBlob));
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute inset-x-0 bottom-0 p-4 bg-card border-t border-border z-20"
      >
        <div className="flex items-center gap-4">
          {/* Cancel button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          {/* Waveform visualization */}
          <div className="flex-1 flex items-center justify-center gap-0.5 h-12">
            {waveformData.map((height, i) => (
              <motion.div
                key={i}
                className={cn(
                  "w-1 rounded-full",
                  audioBlob ? "bg-primary" : "bg-destructive"
                )}
                animate={{ height: `${height * 40}px` }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 min-w-[60px]">
            {!audioBlob && (
              <motion.div
                className="w-2 h-2 rounded-full bg-destructive"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            <span className="text-sm font-mono">{formatDuration(duration)}</span>
          </div>

          {/* Action buttons */}
          {audioBlob ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                size="icon"
                onClick={handleSend}
                className="gradient-glow rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="icon"
              onClick={() => {
                stopRecording();
              }}
              className="bg-destructive hover:bg-destructive/90 rounded-full"
            >
              <div className="w-4 h-4 rounded-sm bg-white" />
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
