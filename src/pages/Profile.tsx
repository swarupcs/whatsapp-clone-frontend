import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Info,
  Check,
  X,
  Bell,
  Shield,
  Moon,
  Volume2,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useChatStore } from '@/store/chatStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, updateUserStatus, logout } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedAbout, setEditedAbout] = useState(user?.about || '');
  const [previewPicture, setPreviewPicture] = useState<string | null>(null);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewPicture(reader.result as string);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!editedName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    updateProfile({
      name: editedName.trim(),
      about: editedAbout.trim(),
      picture: previewPicture || user?.picture,
    });

    setIsEditing(false);
    setPreviewPicture(null);
    toast.success('Profile updated successfully');
  };

  const handleCancel = () => {
    setEditedName(user?.name || '');
    setEditedAbout(user?.about || '');
    setPreviewPicture(null);
    setIsEditing(false);
  };

  const handleStatusChange = (status: 'online' | 'away' | 'offline') => {
    updateUserStatus(status);
    toast.success(`Status changed to ${status}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const statusColors = {
    online: 'bg-[hsl(var(--online))]',
    away: 'bg-[hsl(var(--away))]',
    offline: 'bg-[hsl(var(--offline))]',
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Background gradients */}
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl' />
      </div>

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
            className='rounded-full hover:bg-secondary'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <h1 className='text-2xl font-semibold text-foreground'>Profile</h1>

          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className='ml-auto flex gap-2'
              >
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleCancel}
                  className='rounded-full hover:bg-destructive/20'
                >
                  <X className='h-5 w-5 text-destructive' />
                </Button>
                <Button
                  size='icon'
                  onClick={handleSave}
                  className='rounded-full gradient-glow'
                >
                  <Check className='h-5 w-5' />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='glass rounded-2xl p-6 mb-6'
        >
          <div className='flex flex-col items-center'>
            <div className='relative group'>
              <Avatar className='h-32 w-32 border-4 border-primary/20'>
                <AvatarImage
                  src={previewPicture || user.picture}
                  alt={user.name}
                />
                <AvatarFallback className='text-4xl bg-secondary'>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                className='absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
              >
                <Camera className='h-8 w-8 text-foreground' />
              </button>
              <div
                className={cn(
                  'absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-card',
                  statusColors[user.status],
                )}
              />
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                className='hidden'
              />
            </div>

            {/* Status Selection */}
            <div className='flex gap-2 mt-4'>
              {(['online', 'away', 'offline'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    user.status === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
                  )}
                >
                  <span className='flex items-center gap-2'>
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        statusColors[status],
                      )}
                    />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='glass rounded-2xl p-6 mb-6 space-y-6'
        >
          <div className='space-y-2'>
            <Label className='flex items-center gap-2 text-muted-foreground'>
              <User className='h-4 w-4' />
              Name
            </Label>
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className='bg-input border-border'
                placeholder='Your name'
              />
            ) : (
              <p
                className='text-lg text-foreground cursor-pointer hover:text-primary transition-colors'
                onClick={() => setIsEditing(true)}
              >
                {user.name}
              </p>
            )}
          </div>

          <Separator className='bg-border' />

          <div className='space-y-2'>
            <Label className='flex items-center gap-2 text-muted-foreground'>
              <Mail className='h-4 w-4' />
              Email
            </Label>
            <p className='text-lg text-foreground'>{user.email}</p>
          </div>

          <Separator className='bg-border' />

          <div className='space-y-2'>
            <Label className='flex items-center gap-2 text-muted-foreground'>
              <Info className='h-4 w-4' />
              About
            </Label>
            {isEditing ? (
              <Textarea
                value={editedAbout}
                onChange={(e) => setEditedAbout(e.target.value)}
                className='bg-input border-border resize-none'
                placeholder='Tell something about yourself...'
                rows={3}
              />
            ) : (
              <p
                className='text-foreground cursor-pointer hover:text-primary transition-colors'
                onClick={() => setIsEditing(true)}
              >
                {user.about || 'Add a status message...'}
              </p>
            )}
          </div>

          {!isEditing && (
            <Button
              variant='outline'
              onClick={() => setIsEditing(true)}
              className='w-full mt-4'
            >
              Edit Profile
            </Button>
          )}
        </motion.div>

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='glass rounded-2xl p-6 mb-6 space-y-4'
        >
          <h2 className='text-lg font-semibold text-foreground mb-4'>
            Settings
          </h2>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-secondary'>
                <Bell className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='font-medium text-foreground'>Notifications</p>
                <p className='text-sm text-muted-foreground'>
                  Receive message notifications
                </p>
              </div>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Separator className='bg-border' />

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-secondary'>
                <Volume2 className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='font-medium text-foreground'>Sounds</p>
                <p className='text-sm text-muted-foreground'>
                  Play sound for new messages
                </p>
              </div>
            </div>
            <Switch checked={sounds} onCheckedChange={setSounds} />
          </div>

          <Separator className='bg-border' />

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-secondary'>
                <Moon className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='font-medium text-foreground'>Dark Mode</p>
                <p className='text-sm text-muted-foreground'>Use dark theme</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <Separator className='bg-border' />

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-secondary'>
                <Shield className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='font-medium text-foreground'>Privacy</p>
                <p className='text-sm text-muted-foreground'>
                  Manage your privacy settings
                </p>
              </div>
            </div>
            <Button variant='ghost' size='sm'>
              Manage
            </Button>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant='destructive'
            onClick={handleLogout}
            className='w-full'
          >
            <LogOut className='h-4 w-4 mr-2' />
            Log Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
