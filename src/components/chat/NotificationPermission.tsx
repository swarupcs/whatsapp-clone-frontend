import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/lib/notifications';

export default function NotificationPermission() {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const currentPermission = notificationService.getPermission();
    setPermission(currentPermission);

    // Show banner if permission not decided
    if (currentPermission === 'default') {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      notificationService.showNotification('Notifications Enabled! 🔔', {
        body: 'You will now receive notifications for new messages.',
      });
    }

    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationService.setSoundEnabled(newState);

    if (newState) {
      notificationService.playSound();
    }
  };

  return (
    <>
      {/* Permission Banner */}
      <AnimatePresence>
        {showBanner && permission === 'default' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md'
          >
            <div className='bg-card border border-border rounded-xl p-4 shadow-lg backdrop-blur-sm'>
              <div className='flex items-start gap-3'>
                <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                  <Bell className='h-5 w-5 text-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-sm mb-1'>
                    Enable Notifications
                  </h4>
                  <p className='text-xs text-muted-foreground mb-3'>
                    Get notified when you receive new messages, even when the
                    tab is in the background.
                  </p>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      onClick={handleEnableNotifications}
                      className='text-xs h-8'
                    >
                      Enable
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={handleDismiss}
                      className='text-xs h-8 text-muted-foreground'
                    >
                      Not now
                    </Button>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleDismiss}
                  className='h-6 w-6 shrink-0 -mt-1 -mr-1'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound Toggle Button - shown in settings/header area */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleSound}
        className='fixed bottom-20 right-4 z-40 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors'
        title={
          soundEnabled
            ? 'Mute notification sounds'
            : 'Enable notification sounds'
        }
      >
        {soundEnabled ? (
          <Volume2 className='h-5 w-5 text-primary' />
        ) : (
          <VolumeX className='h-5 w-5 text-muted-foreground' />
        )}
      </motion.button>

      {/* Permission Status Indicator */}
      {permission === 'denied' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='fixed bottom-32 right-4 z-40'
        >
          <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-2 flex items-center gap-2'>
            <BellOff className='h-4 w-4 text-destructive' />
            <span className='text-xs text-destructive'>
              Notifications blocked
            </span>
          </div>
        </motion.div>
      )}
    </>
  );
}
