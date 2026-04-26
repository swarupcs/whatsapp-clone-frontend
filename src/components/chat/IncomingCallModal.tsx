import { setCallState, resetCall } from '@/store/slices/callSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { socketEmit } from '@/lib/socket';

export default function IncomingCallModal() {
  const dispatch = useAppDispatch();

  const callStatus = useAppSelector((state) => state.call.callStatus);
  const callType = useAppSelector((state) => state.call.callType);
  const caller = useAppSelector((state) => state.call.caller);
  const conversationId = useAppSelector((state) => state.call.conversationId);
  const isRinging = callStatus === 'ringing' && caller;

  const acceptCall = () => {
    dispatch(setCallState({}));
  };

  const rejectCall = () => {
    if (caller && conversationId) {
      socketEmit.rejectCall(caller.id, conversationId);
    }
    dispatch(resetCall());
  };

  if (!isRinging) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className='fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl'>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className='flex flex-col items-center text-center p-8'>
          <div className='relative mb-8'>
            {[1, 2, 3].map((r) => (
              <motion.div key={r} className='absolute inset-0 rounded-full border-2 border-primary/30'
                initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: [1, 1.5 + r * 0.3], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: r * 0.4, ease: 'easeOut' }}
                style={{ width: 128, height: 128, left: '50%', top: '50%', marginLeft: -64, marginTop: -64 }} />
            ))}
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Avatar className='h-32 w-32 ring-4 ring-primary/50 shadow-2xl shadow-primary/30'>
                <AvatarImage src={caller.picture} /><AvatarFallback className='text-4xl'>{caller.name[0]}</AvatarFallback>
              </Avatar>
            </motion.div>
          </div>
          <h2 className='text-2xl font-semibold mb-2'>{caller.name}</h2>
          <p className='text-muted-foreground mb-8'>Incoming {callType === 'video' ? 'video' : 'audio'} call...</p>
          <div className='flex items-center gap-8'>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className='flex flex-col items-center'>
              <Button variant='destructive' size='lg' onClick={rejectCall} className='h-16 w-16 rounded-full shadow-lg shadow-destructive/30'>
                <PhoneOff className='h-7 w-7' />
              </Button>
              <p className='text-sm text-muted-foreground mt-2'>Decline</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className='flex flex-col items-center'>
              <Button size='lg' onClick={acceptCall} className='h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 shadow-primary/30'>
                {callType === 'video' ? <Video className='h-7 w-7' /> : <Phone className='h-7 w-7' />}
              </Button>
              <p className='text-sm text-muted-foreground mt-2'>Accept</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
