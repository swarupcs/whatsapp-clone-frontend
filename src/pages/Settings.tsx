import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Bell, BellOff, Volume2, VolumeX, Moon, Sun, Monitor,
  Shield, Lock, Eye, EyeOff, Trash2, Download, HelpCircle,
  MessageSquare, Palette, User, LogOut, ChevronRight, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/queries/useAuth';
import { notificationService } from '@/lib/notifications';
import { toast } from 'sonner';

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink';

const accents: { value: AccentColor; label: string; color: string }[] = [
  { value: 'green', label: 'Green', color: 'bg-emerald-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [theme, setTheme] = useState<Theme>('dark');
  const [accentColor, setAccentColor] = useState<AccentColor>('green');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, []);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    const root = document.documentElement;
    if (t === 'light') { root.classList.remove('dark'); root.classList.add('light'); }
    else if (t === 'dark') { root.classList.remove('light'); root.classList.add('dark'); }
    else { const dark = window.matchMedia('(prefers-color-scheme: dark)').matches; root.classList.toggle('dark', dark); root.classList.toggle('light', !dark); }
    toast.success(`Theme changed to ${t}`);
  };

  const handleLogout = async () => { await logoutMutation.mutateAsync(); navigate('/login'); };

  if (!user) { navigate('/login'); return null; }

  const Section = ({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className='glass rounded-2xl p-6 space-y-4'>
      <h2 className='text-lg font-semibold'>{title}</h2>
      {children}
    </motion.div>
  );

  const Row = ({ icon: Icon, title, description, children, onClick }: { icon: React.ElementType; title: string; description?: string; children?: React.ReactNode; onClick?: () => void }) => (
    <div className={cn('flex items-center justify-between py-2', onClick && 'cursor-pointer hover:bg-secondary/50 -mx-2 px-2 rounded-lg transition-colors')} onClick={onClick}>
      <div className='flex items-center gap-3'>
        <div className='p-2 rounded-lg bg-secondary'><Icon className='h-5 w-5 text-primary' /></div>
        <div>
          <p className='font-medium'>{title}</p>
          {description && <p className='text-sm text-muted-foreground'>{description}</p>}
        </div>
      </div>
      {children || (onClick && <ChevronRight className='h-5 w-5 text-muted-foreground' />)}
    </div>
  );

  return (
    <div className='min-h-screen bg-background'>
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl' />
      </div>

      <div className='relative max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-6'>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className='flex items-center gap-4 mb-8'>
          <Button variant='ghost' size='icon' onClick={() => navigate('/')} className='rounded-full hover:bg-secondary'>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <h1 className='text-2xl font-semibold'>Settings</h1>
        </motion.div>

        <Section title='Account' delay={0.1}>
          <Row icon={User} title='Edit Profile' description='Change your name, photo, and status' onClick={() => navigate('/profile')} />
        </Section>

        <Section title='Notifications' delay={0.15}>
          {notifPermission !== 'granted' && (
            <div className='flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-4'>
              <div className='flex items-center gap-2'>
                <BellOff className='h-5 w-5 text-primary' />
                <span className='text-sm'>Enable browser notifications</span>
              </div>
              <Button size='sm' onClick={async () => {
                const r = await notificationService.requestPermission();
                setNotifPermission(r);
                if (r === 'granted') toast.success('Notifications enabled!');
              }}>Enable</Button>
            </div>
          )}
          <Row icon={Bell} title='Push Notifications' description='Receive notifications for new messages'>
            <Switch checked={notifEnabled} onCheckedChange={setNotifEnabled} />
          </Row>
          <Separator />
          <Row icon={soundEnabled ? Volume2 : VolumeX} title='Notification Sounds' description='Play sound when receiving messages'>
            <Switch checked={soundEnabled} onCheckedChange={(v) => { setSoundEnabled(v); notificationService.setSoundEnabled(v); }} />
          </Row>
          <Separator />
          <Row icon={MessageSquare} title='Message Preview' description='Show message content in notifications'>
            <Switch checked={messagePreview} onCheckedChange={setMessagePreview} />
          </Row>
        </Section>

        <Section title='Appearance' delay={0.2}>
          <div className='space-y-3'>
            <Label className='text-muted-foreground'>Theme</Label>
            <RadioGroup value={theme} onValueChange={(v) => handleThemeChange(v as Theme)} className='flex gap-4'>
              {[{ v: 'light', icon: Sun, label: 'Light' }, { v: 'dark', icon: Moon, label: 'Dark' }, { v: 'system', icon: Monitor, label: 'System' }].map(({ v, icon: Icon, label }) => (
                <div key={v} className='flex items-center space-x-2'>
                  <RadioGroupItem value={v} id={v} />
                  <Label htmlFor={v} className='flex items-center gap-2 cursor-pointer'>
                    <Icon className='h-4 w-4' />{label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <Separator />
          <div className='space-y-3'>
            <Label className='text-muted-foreground'>Accent Color</Label>
            <div className='flex gap-3'>
              {accents.map((a) => (
                <button key={a.value} onClick={() => { setAccentColor(a.value); toast.success(`Accent: ${a.label}`); }}
                  className={cn('w-10 h-10 rounded-full transition-all flex items-center justify-center', a.color,
                    accentColor === a.value ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : 'hover:scale-105')}>
                  {accentColor === a.value && <Check className='h-5 w-5 text-white' />}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <Row icon={Palette} title='Font Size'>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className='w-32'><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value='small'>Small</SelectItem>
                <SelectItem value='medium'>Medium</SelectItem>
                <SelectItem value='large'>Large</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Separator />
          <Row icon={MessageSquare} title='Compact Mode' description='Reduce spacing in messages'>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </Row>
        </Section>

        <Section title='Privacy' delay={0.25}>
          <Row icon={Eye} title='Read Receipts' description="Show when you've read messages">
            <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
          </Row>
          <Separator />
          <Row icon={lastSeen ? Eye : EyeOff} title='Last Seen' description='Show when you were last online'>
            <Switch checked={lastSeen} onCheckedChange={setLastSeen} />
          </Row>
          <Separator />
          <Row icon={MessageSquare} title='Typing Indicator' description="Show when you're typing">
            <Switch checked={typingIndicator} onCheckedChange={setTypingIndicator} />
          </Row>
          <Separator />
          <Row icon={Lock} title='Blocked Users' description='Manage blocked contacts' onClick={() => toast.info('Coming soon')} />
        </Section>

        <Section title='Data & Storage' delay={0.3}>
          <Row icon={Download} title='Export Data' description='Download a copy of your data' onClick={() => toast.success('Export will be ready shortly')} />
          <Separator />
          <Row icon={Shield} title='Security' description='Password and 2FA' onClick={() => toast.info('Coming soon')} />
        </Section>

        <Section title='Help & Support' delay={0.35}>
          <Row icon={HelpCircle} title='Help Center' description='Get answers to common questions' onClick={() => toast.info('Coming soon')} />
        </Section>

        <div className='space-y-4'>
          <Button variant='outline' className='w-full' onClick={handleLogout} disabled={logoutMutation.isPending}>
            <LogOut className='h-4 w-4 mr-2' />Log Out
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive' className='w-full'><Trash2 className='h-4 w-4 mr-2' />Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. All your data will be permanently removed.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { logoutMutation.mutate(); navigate('/login'); }}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
