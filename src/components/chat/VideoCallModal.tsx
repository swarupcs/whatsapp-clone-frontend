import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  MessageSquare,
  MoreVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar: string;
}

export default function VideoCallModal({
  isOpen,
  onClose,
  contactName,
  contactAvatar,
}: VideoCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && isVideoOn) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
      setCallDuration(0);
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions.');
      setIsVideoOn(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleVideo = async () => {
    if (isVideoOn) {
      stream?.getVideoTracks().forEach((track) => (track.enabled = false));
      setIsVideoOn(false);
    } else {
      if (stream) {
        stream.getVideoTracks().forEach((track) => (track.enabled = true));
      } else {
        await startCamera();
      }
      setIsVideoOn(true);
    }
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => (track.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      if (isVideoOn) {
        await startCamera();
      }
      toast.success('Screen sharing stopped');
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (isVideoOn) {
            startCamera();
          }
        };
      } catch (error) {
        console.error('Error sharing screen:', error);
        toast.error('Could not share screen');
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleEndCall = () => {
    stopCamera();
    onClose();
    toast.info('Call ended');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleEndCall}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 border-0 bg-background/95 backdrop-blur-xl overflow-hidden">
        <div ref={containerRef} className="relative w-full h-full flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/50">
                  <AvatarImage src={contactAvatar} />
                  <AvatarFallback>{contactName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-white">{contactName}</h3>
                  <p className="text-sm text-white/70">{formatDuration(callDuration)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEndCall}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Main Video Area */}
          <div className="flex-1 relative bg-secondary/50">
            {/* Remote Video (Contact) - Simulated */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-primary/30">
                  <AvatarImage src={contactAvatar} />
                  <AvatarFallback className="text-4xl">{contactName[0]}</AvatarFallback>
                </Avatar>
                <p className="text-lg text-muted-foreground">Connecting...</p>
                <div className="flex justify-center gap-1 mt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Self Video (Picture-in-Picture) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-24 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-border bg-secondary"
              drag
              dragConstraints={containerRef}
            >
              {isVideoOn && !isScreenSharing ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : isScreenSharing ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                </div>
              )}
              {isMuted && (
                <div className="absolute bottom-2 right-2 p-1 rounded-full bg-destructive">
                  <MicOff className="h-3 w-3 text-white" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
          >
            <div className="flex items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={toggleMute}
                  className={cn(
                    'h-14 w-14 rounded-full',
                    isMuted && 'bg-destructive hover:bg-destructive/90 text-white'
                  )}
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={toggleVideo}
                  className={cn(
                    'h-14 w-14 rounded-full',
                    !isVideoOn && 'bg-destructive hover:bg-destructive/90 text-white'
                  )}
                >
                  {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={toggleScreenShare}
                  className={cn(
                    'h-14 w-14 rounded-full',
                    isScreenSharing && 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  )}
                >
                  <Monitor className="h-6 w-6" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleEndCall}
                  className="h-14 w-14 rounded-full"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </motion.div>

              <div className="w-px h-8 bg-white/20 mx-2" />

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 w-14 rounded-full"
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 w-14 rounded-full"
                >
                  <Users className="h-6 w-6" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 w-14 rounded-full"
                >
                  <MoreVertical className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
