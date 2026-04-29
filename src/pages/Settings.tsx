import { useAppSelector } from '@/store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  LogOut,
  Shield,
  MessageSquare,
  Bell,
  HardDrive,
  HelpCircle,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/queries/useAuth';
import { useTheme } from '@/hooks/useTheme';
import SwiftChatLogo from '@/components/shared/SwiftChatLogo';

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Edit Profile', desc: 'Change your name, photo, and status', route: '/profile' },
      { icon: Shield, label: 'Privacy & Security', desc: 'Two-step verification, blocked contacts', route: null },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: MessageSquare, label: 'Chats', desc: 'Theme, wallpaper, font size', route: null },
      { icon: Bell, label: 'Notifications', desc: 'Sounds, vibration, preview', route: null },
      { icon: HardDrive, label: 'Storage & Data', desc: 'Media usage, clear cache', route: null },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help', desc: 'FAQ, contact support, about SwiftChat', route: null },
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const logoutMutation = useLogout();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  if (!user) { navigate('/login'); return null; }

  return (
    <div className='min-h-screen bg-background'>
      <div className='relative max-w-2xl mx-auto p-4 sm:p-6'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center gap-4 mb-8'
        >
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate('/')}
            className='rounded-xl hover:bg-secondary'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <h1 className='text-2xl font-display font-bold'>Settings</h1>
        </motion.div>

        {/* Theme toggle card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className='glass rounded-2xl p-4 mb-6'
        >
          <button
            onClick={toggleTheme}
            className='w-full flex items-center justify-between hover:opacity-80 transition-opacity'
          >
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-xl gradient-sky'>
                {isDark ? <Moon className='h-5 w-5 text-white' /> : <Sun className='h-5 w-5 text-white' />}
              </div>
              <div className='text-left'>
                <p className='font-medium'>Appearance</p>
                <p className='text-sm text-muted-foreground'>
                  {isDark ? 'Dark mode' : 'Light mode'} · Tap to switch
                </p>
              </div>
            </div>
            <ChevronRight className='h-4 w-4 text-muted-foreground' />
          </button>
        </motion.div>

        {/* Settings sections */}
        {settingsSections.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + sIdx * 0.08 }}
            className='glass rounded-2xl p-4 mb-6'
          >
            <h2 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1'>
              {section.title}
            </h2>
            <div className='space-y-1'>
              {section.items.map(({ icon: Icon, label, desc, route }) => (
                <button
                  key={label}
                  onClick={() => route && navigate(route)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors',
                    !route && 'cursor-default opacity-60',
                  )}
                >
                  <div className='p-2 rounded-xl bg-secondary'>
                    <Icon className='h-5 w-5 text-primary' />
                  </div>
                  <div className='text-left flex-1'>
                    <p className='font-medium text-sm'>{label}</p>
                    <p className='text-xs text-muted-foreground'>{desc}</p>
                  </div>
                  <ChevronRight className='h-4 w-4 text-muted-foreground' />
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant='destructive'
            className='w-full rounded-xl'
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className='h-4 w-4 mr-2' /> Log Out
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='flex justify-center mt-8 mb-4'
        >
          <SwiftChatLogo size='sm' />
        </motion.div>
      </div>
    </div>
  );
}
