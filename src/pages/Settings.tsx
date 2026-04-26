import { useAppSelector } from '@/store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useLogout } from '@/hooks/queries/useAuth';

export default function Settings() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const logoutMutation = useLogout();
  const handleLogout = async () => { await logoutMutation.mutateAsync(); navigate('/login'); };
  if (!user) { navigate('/login'); return null; }
  return (
    <div className='min-h-screen bg-background'>
      <div className='relative max-w-2xl mx-auto p-4 sm:p-6'>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className='flex items-center gap-4 mb-8'>
          <Button variant='ghost' size='icon' onClick={() => navigate('/')} className='rounded-full hover:bg-secondary'><ArrowLeft className='h-5 w-5' /></Button>
          <h1 className='text-2xl font-semibold'>Settings</h1>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className='glass rounded-2xl p-6 mb-6'>
          <button onClick={() => navigate('/profile')} className='w-full flex items-center gap-3 hover:opacity-80 transition-opacity'>
            <div className='p-2 rounded-lg bg-secondary'><User className='h-5 w-5 text-primary' /></div>
            <div className='text-left'><p className='font-medium'>Edit Profile</p><p className='text-sm text-muted-foreground'>Change your name, photo, and status</p></div>
          </button>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button variant='outline' className='w-full' onClick={handleLogout} disabled={logoutMutation.isPending}>
            <LogOut className='h-4 w-4 mr-2' />Log Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
