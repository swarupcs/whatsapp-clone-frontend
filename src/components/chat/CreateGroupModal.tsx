import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Search, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserSearch } from '@/hooks/queries/useUsers';
import { useCreateGroup } from '@/hooks/queries/useConversations';
import type { User } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGroupModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [], isLoading } = useUserSearch(searchQuery);
  const createGroupMutation = useCreateGroup();

  const toggleUser = (user: User) =>
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );

  // Backend requires creator + at least 2 others, so we need at least 2 selected here
  const handleNext = () => {
    if (selectedUsers.length < 2) {
      toast.error('Select at least 2 members');
      return;
    }
    setStep('details');
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Enter a group name');
      return;
    }
    await createGroupMutation.mutateAsync({
      name: groupName,
      userIds: selectedUsers.map((u) => u.id),
    });
    handleClose();
  };

  const handleClose = () => {
    setStep('select');
    setSelectedUsers([]);
    setGroupName('');
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md bg-card border-border'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5 text-primary' />
            {step === 'select' ? 'Select group members' : 'Group details'}
          </DialogTitle>
        </DialogHeader>
        {step === 'select' ? (
          <div className='space-y-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search users...'
                className='pl-10 bg-secondary border-0'
                autoFocus
              />
            </div>
            {selectedUsers.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {selectedUsers.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className='flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-sm'
                  >
                    <span>{u.name.split(' ')[0]}</span>
                    <button onClick={() => toggleUser(u)}>
                      <X className='h-3 w-3' />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
            <div className='max-h-60 overflow-y-auto space-y-1 scrollbar-thin'>
              {isLoading && (
                <div className='flex justify-center py-6'>
                  <Loader2 className='h-5 w-5 animate-spin text-primary' />
                </div>
              )}
              {!isLoading && searchQuery.length === 0 && (
                <p className='text-center text-sm text-muted-foreground py-8'>
                  Type to search for users to add
                </p>
              )}
              {!isLoading &&
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
                      selectedUsers.some((s) => s.id === u.id)
                        ? 'bg-primary/20'
                        : 'hover:bg-muted',
                    )}
                  >
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={u.picture} />
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 text-left'>
                      <p className='font-medium text-sm'>{u.name}</p>
                      <p className='text-xs text-muted-foreground'>{u.email}</p>
                    </div>
                    {selectedUsers.some((s) => s.id === u.id) && (
                      <div className='h-6 w-6 rounded-full bg-primary flex items-center justify-center'>
                        <Check className='h-4 w-4 text-primary-foreground' />
                      </div>
                    )}
                  </button>
                ))}
            </div>
            <div className='space-y-1'>
              <Button
                onClick={handleNext}
                className='w-full gradient-glow'
                disabled={selectedUsers.length < 2}
              >
                Next ({selectedUsers.length} selected)
              </Button>
              {selectedUsers.length > 0 && selectedUsers.length < 2 && (
                <p className='text-xs text-muted-foreground text-center'>
                  Select at least 2 members to create a group
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='flex justify-center'>
              <div className='h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center'>
                <Users className='h-12 w-12 text-primary' />
              </div>
            </div>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder='Group name'
              className='text-center h-12 bg-secondary border-0'
              autoFocus
            />
            <div className='flex justify-center gap-1'>
              {selectedUsers.slice(0, 5).map((u) => (
                <Avatar
                  key={u.id}
                  className='h-8 w-8 border-2 border-background'
                >
                  <AvatarImage src={u.picture} />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
              ))}
              {selectedUsers.length > 5 && (
                <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium'>
                  +{selectedUsers.length - 5}
                </div>
              )}
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setStep('select')}
                className='flex-1'
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                className='flex-1 gradient-glow'
                disabled={!groupName.trim() || createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Create group'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
