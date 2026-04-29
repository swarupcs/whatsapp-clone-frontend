import { store } from '@/store';
import { resetCall } from '@/store/slices/callSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { socketEmit } from '@/lib/socket';

export default function AudioCallModal({ localStream, remoteStream }: { localStream?: MediaStream | null, remoteStream?: MediaStream | null }) {
  const dispatch = useAppDispatch();

  const callStatus = useAppSelector((state) => state.call.callStatus);
  const callType = useAppSelector((state) => state.call.callType);
  const caller = useAppSelector((state) => state.call.caller);
  const receiver = useAppSelector((state) => state.call.receiver);
  const callDuration = useAppSelector((state) => state.call.callDuration);
      const isIncomingCall = useAppSelector((state) => state.call.isIncomingCall);
  const contact = isIncomingCall ? caller : receiver;
  const isOpen = callStatus !== 'idle' && callType === 'audio';

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isOpen]);

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
      <DialogContent className='max-w-md w-[90vw] p-0 border-0 bg-gradient-to-b from-card to-background overflow-hidden'>
        <DialogHeader className="sr-only">
          <DialogTitle>Audio Call with {contact.name}</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col items-center p-8'>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className='relative mb-8'
          >
            <div className={cn('absolute inset-0 bg-primary/20 rounded-full blur-2xl transition-all duration-1000', callStatus === 'connected' ? 'animate-pulse' : 'animate-ping')} />
            <Avatar className='h-32 w-32 ring-4 ring-primary/30 relative z-10'>
              <AvatarImage src={contact.picture} />
              <AvatarFallback className='text-4xl'>{contact.name[0]}</AvatarFallback>
            </Avatar>
          </motion.div>

          <div className='text-center space-y-2 mb-12'>
            <h2 className='text-2xl font-bold'>{contact.name}</h2>
            <p className='text-muted-foreground text-lg capitalize'>
              {callStatus === 'connected' ? fmt(callDuration) : `${callStatus}...`}
            </p>
          </div>

          <audio ref={remoteAudioRef} autoPlay className='hidden' />

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className='flex items-center justify-center gap-6 w-full'>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant='secondary' size='lg' onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={cn('h-14 w-14 rounded-full', !isSpeakerOn && 'bg-secondary hover:bg-secondary/80')}>
                {!isSpeakerOn ? <VolumeX className='h-6 w-6' /> : <Volume2 className='h-6 w-6' />}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant='secondary' size='lg' onClick={toggleMute}
                className={cn('h-14 w-14 rounded-full', isMuted && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground')}>
                {isMuted ? <MicOff className='h-6 w-6' /> : <Mic className='h-6 w-6' />}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant='destructive' size='lg' onClick={handleEndCall} className='h-14 w-14 rounded-full'>
                <PhoneOff className='h-6 w-6' />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
