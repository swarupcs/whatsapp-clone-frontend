import { useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { useUserSearch } from '@/hooks/queries/useUsers';
import { useCreateDirectConversation } from '@/hooks/queries/useConversations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserSearchModal({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading } = useUserSearch(query);
  const createDm = useCreateDirectConversation();

  const handleUserClick = async (userId: string) => {
    await createDm.mutateAsync(userId);
    setQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md bg-card border-border'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Search className='h-5 w-5 text-primary' /> Start new chat
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search by name or email...'
              className='pl-10 bg-secondary border-0'
              autoFocus
            />
          </div>

          <div className='max-h-60 overflow-y-auto space-y-1 scrollbar-thin'>
            {isLoading && (
              <div className='flex justify-center py-6'>
                <Loader2 className='h-5 w-5 animate-spin text-primary' />
              </div>
            )}
            {!isLoading && results.length > 0 &&
              results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  disabled={createDm.isPending}
                  className='w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors'
                >
                  <div className='relative'>
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src={user.picture} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.status === 'online' && (
                      <span className='absolute bottom-0 right-0 h-3 w-3 bg-status-online rounded-full border-2 border-card' />
                    )}
                  </div>
                  <div className='flex-1 text-left'>
                    <p className='font-medium'>{user.name}</p>
                    <p className='text-sm text-muted-foreground'>{user.about || user.email}</p>
                  </div>
                </button>
              ))}
            {!isLoading && query.length > 0 && results.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <p>No users found</p>
                <p className='text-sm'>Try a different search</p>
              </div>
            )}
            {!isLoading && query.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <Search className='h-12 w-12 mx-auto mb-2 opacity-50' />
                <p>Search for users</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
