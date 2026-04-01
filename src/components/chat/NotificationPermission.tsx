import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/lib/notifications';

export default function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const p = notificationService.getPermission();
    setPermission(p);
    if (p === 'default') { const t = setTimeout(() => setShowBanner(true), 2000); return () => clearTimeout(t); }
  }, []);

  const handleEnable = async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);
    if (result === 'granted') notificationService.showNotification('Notifications enabled! 🔔', { body: 'You will receive message notifications.' });
    setShowBanner(false);
  };

  const toggleSound = () => { const next = !soundEnabled; setSoundEnabled(next); notificationService.setSoundEnabled(next); if (next) notificationService.playSound(); };

  return (
    <>
      <AnimatePresence>
        {showBanner && permission === 'default' && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className='fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md'>
            <div className='bg-card border border-border rounded-xl p-4 shadow-lg'>
              <div className='flex items-start gap-3'>
                <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                  <Bell className='h-5 w-5 text-primary' />
                </div>
                <div className='flex-1'>
                  <h4 className='font-semibold text-sm mb-1'>Enable Notifications</h4>
                  <p className='text-xs text-muted-foreground mb-3'>Get notified when you receive new messages.</p>
                  <div className='flex gap-2'>
                    <Button size='sm' onClick={handleEnable} className='text-xs h-8'>Enable</Button>
                    <Button size='sm' variant='ghost' onClick={() => setShowBanner(false)} className='text-xs h-8 text-muted-foreground'>Not now</Button>
                  </div>
                </div>
                <Button variant='ghost' size='icon' onClick={() => setShowBanner(false)} className='h-6 w-6 -mt-1 -mr-1'>
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleSound}
        className='fixed bottom-20 right-4 z-40 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors'>
        {soundEnabled ? <Volume2 className='h-5 w-5 text-primary' /> : <VolumeX className='h-5 w-5 text-muted-foreground' />}
      </motion.button>
    </>
  );
}
