import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Monitor,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  HelpCircle,
  MessageSquare,
  Palette,
  User,
  LogOut,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useChatStore } from '@/store/chatStore';
import { notificationService } from '@/lib/notifications';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink';

const accentColors: { value: AccentColor; label: string; color: string }[] = [
  { value: 'green', label: 'Green', color: 'bg-emerald-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useChatStore();

  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');

  // Appearance settings
  const [theme, setTheme] = useState<Theme>('dark');
  const [accentColor, setAccentColor] = useState<AccentColor>('green');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);

  // Privacy settings
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const root = document.documentElement;

    if (newTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else if (newTheme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    }
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    notificationService.setSoundEnabled(enabled);
    toast.success(enabled ? 'Sounds enabled' : 'Sounds disabled');
  };

  const handleExportData = () => {
    toast.success('Your data export will be ready shortly');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    toast.success('Account deletion request submitted');
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const SettingSection = ({
    children,
    title,
    delay = 0,
  }: {
    children: React.ReactNode;
    title: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className='glass rounded-2xl p-6 space-y-4'
    >
      <h2 className='text-lg font-semibold text-foreground'>{title}</h2>
      {children}
    </motion.div>
  );

  const SettingRow = ({
    icon: Icon,
    title,
    description,
    children,
    onClick,
  }: {
    icon: React.ElementType;
    title: string;
    description?: string;
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div
      className={cn(
        'flex items-center justify-between py-2',
        onClick &&
          'cursor-pointer hover:bg-secondary/50 -mx-2 px-2 rounded-lg transition-colors',
      )}
      onClick={onClick}
    >
      <div className='flex items-center gap-3'>
        <div className='p-2 rounded-lg bg-secondary'>
          <Icon className='h-5 w-5 text-primary' />
        </div>
        <div>
          <p className='font-medium text-foreground'>{title}</p>
          {description && (
            <p className='text-sm text-muted-foreground'>{description}</p>
          )}
        </div>
      </div>
      {children ||
        (onClick && <ChevronRight className='h-5 w-5 text-muted-foreground' />)}
    </div>
  );

  return (
    <div className='min-h-screen bg-background'>
      {/* Background gradients */}
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl' />
      </div>

      <div className='relative max-w-2xl mx-auto p-4 sm:p-6 pb-24'>
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
            className='rounded-full hover:bg-secondary'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <h1 className='text-2xl font-semibold text-foreground'>Settings</h1>
        </motion.div>

        <div className='space-y-6'>
          {/* Account Section */}
          <SettingSection title='Account' delay={0.1}>
            <SettingRow
              icon={User}
              title='Edit Profile'
              description='Change your name, photo, and status'
              onClick={() => navigate('/profile')}
            />
          </SettingSection>

          {/* Notifications Section */}
          <SettingSection title='Notifications' delay={0.15}>
            {notificationPermission !== 'granted' && (
              <div className='flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-4'>
                <div className='flex items-center gap-2'>
                  <BellOff className='h-5 w-5 text-primary' />
                  <span className='text-sm text-foreground'>
                    Enable browser notifications
                  </span>
                </div>
                <Button size='sm' onClick={handleRequestNotificationPermission}>
                  Enable
                </Button>
              </div>
            )}

            <SettingRow
              icon={Bell}
              title='Push Notifications'
              description='Receive notifications for new messages'
            >
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </SettingRow>

            <Separator className='bg-border' />

            <SettingRow
              icon={soundEnabled ? Volume2 : VolumeX}
              title='Notification Sounds'
              description='Play sound when receiving messages'
            >
              <Switch
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </SettingRow>

            <Separator className='bg-border' />

            <SettingRow
              icon={MessageSquare}
              title='Message Preview'
              description='Show message content in notifications'
            >
              <Switch
                checked={messagePreview}
                onCheckedChange={setMessagePreview}
              />
            </SettingRow>
          </SettingSection>

          {/* Appearance Section */}
          <SettingSection title='Appearance' delay={0.2}>
            <div className='space-y-4'>
              <Label className='text-muted-foreground'>Theme</Label>
              <RadioGroup
                value={theme}
                onValueChange={(value) => handleThemeChange(value as Theme)}
                className='flex gap-4'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='light' id='light' />
                  <Label
                    htmlFor='light'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <Sun className='h-4 w-4' />
                    Light
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='dark' id='dark' />
                  <Label
                    htmlFor='dark'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <Moon className='h-4 w-4' />
                    Dark
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='system' id='system' />
                  <Label
                    htmlFor='system'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <Monitor className='h-4 w-4' />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator className='bg-border' />

            <div className='space-y-4'>
              <Label className='text-muted-foreground'>Accent Color</Label>
              <div className='flex gap-3'>
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setAccentColor(color.value);
                      toast.success(`Accent color changed to ${color.label}`);
                    }}
                    className={cn(
                      'w-10 h-10 rounded-full transition-all flex items-center justify-center',
                      color.color,
                      accentColor === color.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                        : 'hover:scale-105',
                    )}
                  >
                    {accentColor === color.value && (
                      <Check className='h-5 w-5 text-white' />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator className='bg-border' />

            <SettingRow icon={Palette} title='Font Size'>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='small'>Small</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='large'>Large</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <Separator className='bg-border' />

            <SettingRow
              icon={MessageSquare}
              title='Compact Mode'
              description='Reduce spacing in chat messages'
            >
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </SettingRow>
          </SettingSection>

          {/* Privacy Section */}
          <SettingSection title='Privacy' delay={0.25}>
            <SettingRow
              icon={Eye}
              title='Read Receipts'
              description="Let others know when you've read their messages"
            >
              <Switch
                checked={readReceipts}
                onCheckedChange={setReadReceipts}
              />
            </SettingRow>

            <Separator className='bg-border' />

            <SettingRow
              icon={lastSeen ? Eye : EyeOff}
              title='Last Seen'
              description='Show when you were last online'
            >
              <Switch checked={lastSeen} onCheckedChange={setLastSeen} />
            </SettingRow>

            <Separator className='bg-border' />

            <SettingRow
              icon={MessageSquare}
              title='Typing Indicator'
              description="Show when you're typing a message"
            >
              <Switch
                checked={typingIndicator}
                onCheckedChange={setTypingIndicator}
              />
            </SettingRow>

            <Separator className='bg-border' />

            <SettingRow
              icon={Lock}
              title='Blocked Users'
              description='Manage your blocked contacts'
              onClick={() => toast.info('Blocked users settings coming soon')}
            />
          </SettingSection>

          {/* Data & Storage Section */}
          <SettingSection title='Data & Storage' delay={0.3}>
            <SettingRow
              icon={Download}
              title='Export Data'
              description='Download a copy of your data'
              onClick={handleExportData}
            />

            <Separator className='bg-border' />

            <SettingRow
              icon={Shield}
              title='Security'
              description='Password and two-factor authentication'
              onClick={() => toast.info('Security settings coming soon')}
            />
          </SettingSection>

          {/* Help Section */}
          <SettingSection title='Help & Support' delay={0.35}>
            <SettingRow
              icon={HelpCircle}
              title='Help Center'
              description='Get answers to common questions'
              onClick={() => toast.info('Help center coming soon')}
            />
          </SettingSection>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='space-y-4'
          >
            <Button variant='outline' className='w-full' onClick={handleLogout}>
              <LogOut className='h-4 w-4 mr-2' />
              Log Out
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' className='w-full'>
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
