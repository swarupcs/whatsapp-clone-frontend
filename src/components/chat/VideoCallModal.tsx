import { store } from '@/store';
import { resetCall } from '@/store/slices/callSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { socketEmit } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function VideoCallModal({ localStream, remoteStream }: { localStream?: MediaStream | null, remoteStream?: MediaStream | null }) {
  const dispatch = useAppDispatch();

  const callStatus = useAppSelector((state) => state.call.callStatus);
  const callType = useAppSelector((state) => state.call.callType);
  const caller = useAppSelector((state) => state.call.caller);
  const receiver = useAppSelector((state) => state.call.receiver);
  const callDuration = useAppSelector((state) => state.call.callDuration);
      const isIncomingCall = useAppSelector((state) => state.call.isIncomingCall);
  const contact = isIncomingCall ? caller : receiver;
  const isOpen = callStatus !== 'idle' && callType === 'video';

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isOpen]);

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t: any) => (t.enabled = !isVideoOn));
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t: any) => (t.enabled = !isMuted));
      setIsMuted(!isMuted);
    }
  };

  const handleEndCall = () => {
    const state = store.getState().call;
    if (state.conversationId && contact) {
      socketEmit.endCall(state.conversationId, contact.id);
    }
    dispatch(resetCall());
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!isOpen || !contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleEndCall}>
      <DialogContent className='max-w-4xl w-[90vw] h-[85vh] p-0 border-0 bg-background/95 backdrop-blur-xl overflow-hidden'>
        <div ref={containerRef} className='relative w-full h-full flex flex-col'>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className='absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Avatar className='h-10 w-10 ring-2 ring-primary/50'>
                  <AvatarImage src={contact.picture} />
                  <AvatarFallback>{contact.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='font-semibold text-white'>{contact.name}</h3>
                  <p className='text-sm text-white/70'>
                    {callStatus === 'connected' ? fmt(callDuration) : 'Connecting...'}
                  </p>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button variant='ghost' size='icon' onClick={() => {
                  if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setIsFullscreen(true); }
                  else { document.exitFullscreen(); setIsFullscreen(false); }
                }} className='text-white/70 hover:text-white hover:bg-white/10'>
                  {isFullscreen ? <Minimize2 className='h-5 w-5' /> : <Maximize2 className='h-5 w-5' />}
                </Button>
                <Button variant='ghost' size='icon' onClick={handleEndCall} className='text-white/70 hover:text-white hover:bg-white/10'>
                  <X className='h-5 w-5' />
                </Button>
              </div>
            </div>
          </motion.div>
          
          <div className='flex-1 relative bg-secondary/50 flex items-center justify-center overflow-hidden'>
            {!remoteStream && (
              <div className='text-center z-10'>
                <Avatar className='h-32 w-32 mx-auto mb-4 ring-4 ring-primary/30'>
                  <AvatarImage src={contact.picture} />
                  <AvatarFallback className='text-4xl'>{contact.name[0]}</AvatarFallback>
                </Avatar>
                <p className='text-lg text-white font-medium drop-shadow-md capitalize'>{callStatus}...</p>
              </div>
            )}
            
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={cn('w-full h-full object-cover', !remoteStream && 'hidden')}
            />

            <motion.div
              drag
              dragConstraints={containerRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className='absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-72 bg-black rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20 cursor-move z-20'
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn('w-full h-full object-cover', !isVideoOn && 'hidden')}
              />
              {!isVideoOn && (
                <div className='absolute inset-0 flex items-center justify-center bg-secondary'>
                  <VideoOff className='h-8 w-8 text-muted-foreground' />
                </div>
              )}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className='absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4'>
            <Button variant='secondary' size='lg' onClick={toggleMute}
              className={cn('h-14 w-14 rounded-full backdrop-blur-md', isMuted ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-white/20 hover:bg-white/30 text-white')}>
              {isMuted ? <MicOff className='h-6 w-6' /> : <Mic className='h-6 w-6' />}
            </Button>
            <Button variant='destructive' size='lg' onClick={handleEndCall} className='h-14 w-14 rounded-full'>
              <X className='h-6 w-6' />
            </Button>
            <Button variant='secondary' size='lg' onClick={toggleVideo}
              className={cn('h-14 w-14 rounded-full backdrop-blur-md', !isVideoOn ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-white/20 hover:bg-white/30 text-white')}>
              {!isVideoOn ? <VideoOff className='h-6 w-6' /> : <Video className='h-6 w-6' />}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
