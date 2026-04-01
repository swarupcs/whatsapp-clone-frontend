import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface Props { isOpen: boolean; onClose: () => void; contactName: string; contactAvatar: string; }
export default function VideoCallModal({ isOpen, onClose, contactName, contactAvatar }: Props) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (isOpen && isVideoOn) startCamera(); return stopCamera; }, [isOpen]);
  useEffect(() => { let iv: ReturnType<typeof setInterval>; if (isOpen) iv = setInterval(() => setCallDuration((d) => d + 1), 1000); return () => { clearInterval(iv); setCallDuration(0); }; }, [isOpen]);
  const startCamera = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); setStream(s); if (videoRef.current) videoRef.current.srcObject = s; } catch { toast.error('Camera unavailable'); setIsVideoOn(false); } };
  const stopCamera = () => { stream?.getTracks().forEach((t) => t.stop()); setStream(null); };
  const toggleVideo = async () => { if (isVideoOn) { stream?.getVideoTracks().forEach((t) => (t.enabled = false)); setIsVideoOn(false); } else { if (stream) stream.getVideoTracks().forEach((t) => (t.enabled = true)); else await startCamera(); setIsVideoOn(true); } };
  const toggleMute = () => { stream?.getAudioTracks().forEach((t) => (t.enabled = isMuted)); setIsMuted(!isMuted); };
  const handleEndCall = () => { stopCamera(); onClose(); };
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  return (
    <Dialog open={isOpen} onOpenChange={handleEndCall}>
      <DialogContent className='max-w-4xl w-[90vw] h-[85vh] p-0 border-0 bg-background/95 backdrop-blur-xl overflow-hidden'>
        <div ref={containerRef} className='relative w-full h-full flex flex-col'>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className='absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Avatar className='h-10 w-10 ring-2 ring-primary/50'><AvatarImage src={contactAvatar} /><AvatarFallback>{contactName[0]}</AvatarFallback></Avatar>
                <div><h3 className='font-semibold text-white'>{contactName}</h3><p className='text-sm text-white/70'>{fmt(callDuration)}</p></div>
              </div>
              <div className='flex gap-2'>
                <Button variant='ghost' size='icon' onClick={() => { if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setIsFullscreen(true); } else { document.exitFullscreen(); setIsFullscreen(false); } }} className='text-white/70 hover:text-white hover:bg-white/10'>
                  {isFullscreen ? <Minimize2 className='h-5 w-5' /> : <Maximize2 className='h-5 w-5' />}
                </Button>
                <Button variant='ghost' size='icon' onClick={handleEndCall} className='text-white/70 hover:text-white hover:bg-white/10'><X className='h-5 w-5' /></Button>
              </div>
            </div>
          </motion.div>
          <div className='flex-1 relative bg-secondary/50 flex items-center justify-center'>
            <div className='text-center'>
              <Avatar className='h-32 w-32 mx-auto mb-4 ring-4 ring-primary/30'><AvatarImage src={contactAvatar} /><AvatarFallback className='text-4xl'>{contactName[0]}</AvatarFallback></Avatar>
              <p className='text-lg text-muted-foreground'>Connecting...</p>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className='absolute bottom-24 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-border bg-secondary' drag dragConstraints={containerRef}>
              {isVideoOn ? <video ref={videoRef} autoPlay muted playsInline className='w-full h-full object-cover' style={{ transform: 'scaleX(-1)' }} />
                : <div className='w-full h-full flex items-center justify-center bg-secondary'><Avatar className='h-16 w-16'><AvatarFallback>You</AvatarFallback></Avatar></div>}
              {isMuted && <div className='absolute bottom-2 right-2 p-1 rounded-full bg-destructive'><MicOff className='h-3 w-3 text-white' /></div>}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent'>
            <div className='flex items-center justify-center gap-4'>
              {[{ onClick: toggleMute, active: isMuted, icon: isMuted ? MicOff : Mic }, { onClick: toggleVideo, active: !isVideoOn, icon: isVideoOn ? Video : VideoOff }].map(({ onClick, active, icon: Icon }, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant='secondary' size='lg' onClick={onClick} className={cn('h-14 w-14 rounded-full', active && 'bg-destructive hover:bg-destructive/90 text-white')}><Icon className='h-6 w-6' /></Button>
                </motion.div>
              ))}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant='destructive' size='lg' onClick={handleEndCall} className='h-14 w-14 rounded-full'><PhoneOff className='h-6 w-6' /></Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
