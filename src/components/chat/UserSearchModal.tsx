import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUserSearch } from '@/hooks/queries/useUsers';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveConversation } from '@/store/slices/chatSlice';
import { conversationKeys } from '@/hooks/queries/useConversations';
import type { Conversation, User } from '@/types';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function UserSearchModal({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading } = useUserSearch(query);
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const handleUserClick = (user: User) => {
    const conversations = queryClient.getQueryData<Conversation[]>(conversationKeys.all) || [];
    
    // Check if a direct conversation already exists with this user
    const existing = conversations.find(
      (c) => !c.isGroup && c.users.some((u) => u.id === user.id)
    );

    if (existing) {
      dispatch(setActiveConversation(existing));
    } else {
      // Create an optimistic "virtual" conversation to show in the UI immediately
      const virtualConv: Conversation = {
        id: `virtual_${user.id}`,
        name: user.name,
        picture: user.picture,
        isGroup: false,
        users: [currentUser!, user],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch(setActiveConversation(virtualConv));
    }

    setQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md bg-card border-border'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'><Search className='h-5 w-5 text-primary' /> Start new chat</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search by name or email...'
              className='pl-10 bg-secondary border-0' autoFocus />
          </div>
          <div className='max-h-60 overflow-y-auto space-y-1 scrollbar-thin'>
            {isLoading && <div className='flex justify-center py-6'><Loader2 className='h-5 w-5 animate-spin text-primary' /></div>}
            {!isLoading && results.length > 0 && results.map((user) => (
              <button key={user.id} onClick={() => handleUserClick(user)}
                className='w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors'>
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
              <div className='text-center py-8 text-muted-foreground'><p>No users found</p></div>
            )}
            {!isLoading && query.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <Search className='h-12 w-12 mx-auto mb-2 opacity-50' /><p>Search for users</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
