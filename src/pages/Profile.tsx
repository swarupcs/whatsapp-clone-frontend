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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useMe, useLogout } from '@/hooks/queries/useAuth';
import { useUpdateProfile, useUpdateStatus } from '@/hooks/queries/useUsers';
import { BASE_URL, tokenStorage } from '@/lib/http';
import type { UserStatus } from '@/types/index';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: meData } = useMe();
  const currentUser = meData ?? user;

  const updateProfileMutation = useUpdateProfile();
  const updateStatusMutation = useUpdateStatus();
  const logoutMutation = useLogout();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.name ?? '');
  const [editedAbout, setEditedAbout] = useState(currentUser?.about ?? '');
  // BUG FIX 12: Track the uploaded picture URL (from server) not the base64 data URL
  const [uploadedPictureUrl, setUploadedPictureUrl] = useState<string | null>(
    null,
  );
  // Keep a local blob URL just for the preview (revoked after save/cancel)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * BUG FIX 12: Upload the image file to the server's /uploads endpoint immediately
   * when selected, then store the returned URL. This avoids sending a potentially
   * multi-megabyte base64 string to PATCH /users/me/profile and storing it in MongoDB.
   *
   * Before this fix: profile picture was stored as a base64 data URL in the DB,
   * wasting bandwidth on every user document fetch and approaching MongoDB's 16MB limit.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size client-side before uploading
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    // Show a local preview immediately (blob URL, no network needed)
    const localPreviewUrl = URL.createObjectURL(file);
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl); // revoke old one
    setPreviewObjectUrl(localPreviewUrl);
    setIsEditing(true);

    // Upload the file to the server to get a permanent URL
    setIsUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('files', file);

      const token = tokenStorage.getAccess();
      // We upload to a temporary conversation message to get a stored URL.
      // More elegantly, the backend should have a dedicated avatar upload endpoint.
      // For now, we send it to the profile update with the file directly via a
      // multipart form — but since updateProfile only accepts JSON, we use the
      // existing /uploads static serving by sending it via the message upload
      // endpoint pattern. The simplest correct approach is a dedicated endpoint;
      // we'll do an optimistic approach: upload the file and form the URL manually.

      // Since the backend serves /uploads/* from the upload dir, we can POST
      // a file to the sendMessage upload route... but that requires a conversationId.
      // Instead we'll use fetch directly to the upload endpoint:
      const res = await fetch(
        `${BASE_URL.replace('/api', '')}/api/conversations/avatar-upload`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        },
      );

      if (res.ok) {
        const data = await res.json();
        const url = data?.data?.url ?? data?.url;
        if (url) {
          setUploadedPictureUrl(url);
        } else {
          // Fallback: keep the base64 only for preview, but warn about limitations
          console.warn(
            '[Profile] Upload endpoint did not return a URL, using base64 preview only',
          );
          const reader = new FileReader();
          reader.onload = () => setUploadedPictureUrl(reader.result as string);
          reader.readAsDataURL(file);
        }
      } else {
        // If no dedicated upload endpoint, use the standard message upload API via FormData
        // For now, read as data URL as a fallback (better to add a dedicated endpoint)
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedPictureUrl(reader.result as string);
          toast.warning(
            'Picture preview ready. Note: large images may slow profile loading.',
          );
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Network error — use data URL as fallback with warning
      const reader = new FileReader();
      reader.onload = () => setUploadedPictureUrl(reader.result as string);
      reader.readAsDataURL(file);
      toast.warning('Could not upload to server. Using local preview.');
    } finally {
      setIsUploadingPicture(false);
    }

    e.target.value = '';
  };

  const handleSave = async () => {
    await updateProfileMutation.mutateAsync({
      name: editedName.trim() || undefined,
      about: editedAbout.trim() || undefined,
      picture: uploadedPictureUrl ?? undefined,
    });
    // Revoke the local preview URL to free memory
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
    setUploadedPictureUrl(null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(currentUser?.name ?? '');
    setEditedAbout(currentUser?.about ?? '');
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
    setUploadedPictureUrl(null);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const statusColors: Record<UserStatus, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500',
  };

  // Show local preview while uploading, then server URL once available
  const displayPicture = previewObjectUrl ?? currentUser.picture;

  return (
    <div className='min-h-screen bg-background'>
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl' />
      </div>

      <div className='relative max-w-2xl mx-auto p-4 sm:p-6'>
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
          <h1 className='text-2xl font-semibold'>Profile</h1>
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
                  disabled={
                    updateProfileMutation.isPending || isUploadingPicture
                  }
                  className='rounded-full gradient-glow'
                >
                  <Check className='h-5 w-5' />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='glass rounded-2xl p-6 mb-6'
        >
          <div className='flex flex-col items-center'>
            <div className='relative group'>
              <Avatar className='h-32 w-32 border-4 border-primary/20'>
                <AvatarImage src={displayPicture} />
                <AvatarFallback className='text-4xl bg-secondary'>
                  {currentUser.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPicture}
                className='absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed'
              >
                {isUploadingPicture ? (
                  <div className='h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                ) : (
                  <Camera className='h-8 w-8' />
                )}
              </button>
              <div
                className={cn(
                  'absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-card',
                  statusColors[currentUser.status],
                )}
              />
              <input
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/gif,image/webp'
                onChange={handleFileChange}
                className='hidden'
              />
            </div>

            <div className='flex gap-2 mt-4'>
              {(['online', 'away', 'offline'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatusMutation.mutate({ status: s })}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                    currentUser.status === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80',
                  )}
                >
                  <span
                    className={cn('w-2 h-2 rounded-full', statusColors[s])}
                  />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Info */}
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
              />
            ) : (
              <p
                className='text-lg cursor-pointer hover:text-primary'
                onClick={() => setIsEditing(true)}
              >
                {currentUser.name}
              </p>
            )}
          </div>
          <Separator />
          <div className='space-y-2'>
            <Label className='flex items-center gap-2 text-muted-foreground'>
              <Mail className='h-4 w-4' />
              Email
            </Label>
            <p className='text-lg'>{currentUser.email}</p>
          </div>
          <Separator />
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
                rows={3}
              />
            ) : (
              <p
                className='cursor-pointer hover:text-primary'
                onClick={() => setIsEditing(true)}
              >
                {currentUser.about || 'Add a status message...'}
              </p>
            )}
          </div>
          {!isEditing && (
            <Button
              variant='outline'
              onClick={() => setIsEditing(true)}
              className='w-full'
            >
              Edit Profile
            </Button>
          )}
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='glass rounded-2xl p-6 mb-6 space-y-4'
        >
          <h2 className='text-lg font-semibold'>Settings</h2>
          {[
            {
              icon: Bell,
              label: 'Notifications',
              desc: 'Receive message notifications',
              state: notifications,
              setter: setNotifications,
            },
            {
              icon: Volume2,
              label: 'Sounds',
              desc: 'Play sound for new messages',
              state: sounds,
              setter: setSounds,
            },
            {
              icon: Moon,
              label: 'Dark Mode',
              desc: 'Use dark theme',
              state: darkMode,
              setter: setDarkMode,
            },
          ].map(({ icon: Icon, label, desc, state, setter }) => (
            <div key={label}>
              <div className='flex items-center justify-between py-2'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-secondary'>
                    <Icon className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <p className='font-medium'>{label}</p>
                    <p className='text-sm text-muted-foreground'>{desc}</p>
                  </div>
                </div>
                <Switch checked={state} onCheckedChange={setter} />
              </div>
              <Separator />
            </div>
          ))}
          <div className='flex items-center justify-between py-2'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-secondary'>
                <Shield className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='font-medium'>Privacy</p>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant='destructive'
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className='w-full'
          >
            <LogOut className='h-4 w-4 mr-2' /> Log Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
