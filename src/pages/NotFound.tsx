import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import SwiftChatLogo from '@/components/shared/SwiftChatLogo';

export default function NotFound() {
  const location = useLocation();
  useEffect(() => { console.error('404:', location.pathname); }, [location.pathname]);
  return (
    <div className='flex min-h-screen items-center justify-center bg-background'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center space-y-6'
      >
        <h1 className='text-7xl font-display font-bold gradient-text'>404</h1>
        <p className='text-xl text-muted-foreground'>Page not found</p>
        <a href='/' className='inline-block px-6 py-3 rounded-xl gradient-glow text-white font-semibold hover:shadow-lg hover:shadow-brand-orange/25 transition-shadow'>
          Return to SwiftChat
        </a>
        <div className='mt-8'>
          <SwiftChatLogo size='sm' className='justify-center opacity-50' />
        </div>
      </motion.div>
    </div>
  );
}
