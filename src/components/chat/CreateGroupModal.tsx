import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Search, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useChatStore, type User } from '@/store/chatStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock users for group creation
const availableUsers: User[] = [
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    status: 'online',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    status: 'away',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    status: 'offline',
  },
  {
    id: '5',
    name: 'Alex Brown',
    email: 'alex@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    status: 'online',
  },
  {
    id: '6',
    name: 'Emily Davis',
    email: 'emily@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    status: 'online',
  },
  {
    id: '7',
    name: 'Chris Lee',
    email: 'chris@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris',
    status: 'offline',
  },
  {
    id: '8',
    name: 'David Miller',
    email: 'david@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    status: 'online',
  },
];

export default function CreateGroupModal({
  open,
  onOpenChange,
}: CreateGroupModalProps) {
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const createGroup = useChatStore((state) => state.createGroup);

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleNext = () => {
    if (selectedUsers.length < 2) {
      toast.error('Select at least 2 members');
      return;
    }
    setStep('details');
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      toast.error('Enter a group name');
      return;
    }

    createGroup(groupName, selectedUsers);
    toast.success('Group created successfully!');
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
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search users...'
                className='pl-10 bg-secondary border-0'
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {selectedUsers.map((userId) => {
                  const user = availableUsers.find((u) => u.id === userId);
                  return (
                    <motion.div
                      key={userId}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className='flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-sm'
                    >
                      <span>{user?.name.split(' ')[0]}</span>
                      <button onClick={() => toggleUser(userId)}>
                        <X className='h-3 w-3' />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* User List */}
            <div className='max-h-60 overflow-y-auto space-y-1 scrollbar-thin'>
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
                    selectedUsers.includes(user.id)
                      ? 'bg-primary/20'
                      : 'hover:bg-muted',
                  )}
                >
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={user.picture} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1 text-left'>
                    <p className='font-medium text-sm'>{user.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {user.email}
                    </p>
                  </div>
                  {selectedUsers.includes(user.id) && (
                    <div className='h-6 w-6 rounded-full bg-primary flex items-center justify-center'>
                      <Check className='h-4 w-4 text-primary-foreground' />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Button
              onClick={handleNext}
              className='w-full gradient-glow'
              disabled={selectedUsers.length < 2}
            >
              Next ({selectedUsers.length} selected)
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Group Avatar */}
            <div className='flex justify-center'>
              <div className='h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center'>
                <Users className='h-12 w-12 text-primary' />
              </div>
            </div>

            {/* Group Name */}
            <div>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder='Group name'
                className='text-center h-12 bg-secondary border-0'
              />
            </div>

            {/* Selected Members */}
            <div className='flex justify-center gap-1'>
              {selectedUsers.slice(0, 5).map((userId) => {
                const user = availableUsers.find((u) => u.id === userId);
                return (
                  <Avatar
                    key={userId}
                    className='h-8 w-8 border-2 border-background'
                  >
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback>{user?.name[0]}</AvatarFallback>
                  </Avatar>
                );
              })}
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
                disabled={!groupName.trim()}
              >
                Create group
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
