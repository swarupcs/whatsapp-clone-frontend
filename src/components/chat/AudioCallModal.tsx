import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar: string;
}

export default function AudioCallModal({ isOpen, onClose, contactName, contactAvatar }: Props) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'calling' | 'connected'>('calling');

  useEffect(() => {
    if (isOpen) {
      setCallState('calling');
      setCallDuration(0);
      const t = setTimeout(() => setCallState('connected'), 2000 + Math.random() * 2000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>;
    if (isOpen && callState === 'connected') iv = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(iv);
  }, [isOpen, callState]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md w-[90vw] p-0 border-0 bg-gradient-to-b from-card to-background overflow-hidden'>
        <div className='flex flex-col items-center p-8'>
          <div className='relative mb-6'>
            {callState === 'calling' && [1, 2, 3].map((r) => (
              <motion.div key={r}
                className='absolute inset-0 rounded-full border-2 border-primary/20'
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: [1, 1.3 + r * 0.2], opacity: [0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: r * 0.3 }}
                style={{ width: 120, height: 120, left: '50%', top: '50%', marginLeft: -60, marginTop: -60 }} />
            ))}
            <motion.div animate={callState === 'calling' ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}>
              <Avatar className='h-28 w-28 ring-4 ring-primary/30 shadow-xl'>
                <AvatarImage src={contactAvatar} />
                <AvatarFallback className='text-3xl'>{contactName[0]}</AvatarFallback>
              </Avatar>
            </motion.div>
          </div>

          <h3 className='text-xl font-semibold mb-1'>{contactName}</h3>
          <motion.p className='text-muted-foreground mb-8'
            animate={callState === 'calling' ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}>
            {callState === 'calling' ? 'Calling...' : fmt(callDuration)}
          </motion.p>

          {callState === 'connected' && (
            <div className='flex items-center justify-center gap-1 h-12 mb-8'>
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div key={i} className='w-1 bg-primary rounded-full'
                  animate={{ height: ['8px', `${16 + Math.random() * 24}px`, '8px'] }}
                  transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.05 }} />
              ))}
            </div>
          )}

          <div className='flex items-center justify-center gap-6'>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant='secondary' size='lg' onClick={() => setIsMuted(!isMuted)}
                className={cn('h-14 w-14 rounded-full', isMuted && 'bg-destructive hover:bg-destructive/90 text-white')}>
                {isMuted ? <MicOff className='h-6 w-6' /> : <Mic className='h-6 w-6' />}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant='destructive' size='lg' onClick={onClose}
                className='h-16 w-16 rounded-full shadow-lg shadow-destructive/30'>
                <PhoneOff className='h-7 w-7' />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant='secondary' size='lg' onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={cn('h-14 w-14 rounded-full', isSpeakerOn && 'bg-primary hover:bg-primary/90 text-white')}>
                {isSpeakerOn ? <Volume2 className='h-6 w-6' /> : <VolumeX className='h-6 w-6' />}
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
