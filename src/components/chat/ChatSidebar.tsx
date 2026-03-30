import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Search, MoreVertical, MessageCircle, Users, Settings,
  LogOut, Plus, FileSearch, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useConversations } from '@/hooks/queries/useConversations';
import { useLogout } from '@/hooks/queries/useAuth';
import CreateGroupModal from './CreateGroupModal';
import UserSearchModal from './UserSearchModal';
import MessageSearchModal from './MessageSearchModal';
import type { Conversation } from '@/types/index';

interface ChatSidebarProps {
  onConversationSelect?: () => void;
}

export default function ChatSidebar({ onConversationSelect }: ChatSidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);

  const { user } = useAuthStore();
  const { activeConversation, setActiveConversation, onlineUsers } = useChatStore();
  const { data: conversations = [], isLoading } = useConversations();
  const logoutMutation = useLogout();

  const filtered = conversations.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'unread') return conv.unreadCount > 0;
    if (activeFilter === 'groups') return conv.isGroup;
    return true;
  });

  const handleConversationClick = (conv: Conversation) => {
    setActiveConversation(conv);
    onConversationSelect?.();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  return (
    <div className='chat-sidebar'>
      {/* Header */}
      <div className='h-16 px-4 flex items-center justify-between border-b border-border bg-card/50'>
        <button
          onClick={() => navigate('/profile')}
          className='flex items-center gap-3 hover:opacity-80 transition-opacity'
        >
          <Avatar className='h-10 w-10 ring-2 ring-primary/20'>
            <AvatarImage src={user?.picture} />
            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className='hidden lg:block text-left'>
            <h3 className='font-semibold text-sm truncate'>{user?.name}</h3>
            <p className='text-xs text-muted-foreground capitalize'>{user?.status}</p>
          </div>
        </button>

        <div className='flex items-center gap-1'>
          <Button
            variant='ghost' size='icon'
            className='text-muted-foreground hover:text-foreground'
            onClick={() => setShowMessageSearch(true)}
          >
            <FileSearch className='h-5 w-5' />
          </Button>
          <Button
            variant='ghost' size='icon'
            className='text-muted-foreground hover:text-foreground'
            onClick={() => setShowUserSearch(true)}
          >
            <Plus className='h-5 w-5' />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='text-muted-foreground hover:text-foreground'>
                <MoreVertical className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                <Users className='mr-2 h-4 w-4' /> New group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowUserSearch(true)}>
                <MessageCircle className='mr-2 h-4 w-4' /> New chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className='mr-2 h-4 w-4' /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className='text-destructive'>
                <LogOut className='mr-2 h-4 w-4' /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className='p-3'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search or start new chat'
            className='pl-10 h-10 bg-secondary border-0 rounded-lg'
          />
        </div>
      </div>

      {/* Filters */}
      <div className='px-3 pb-2 flex gap-2'>
        {(['all', 'unread', 'groups'] as const).map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? 'secondary' : 'ghost'}
            size='sm'
            className={cn(
              'rounded-full text-xs h-7 px-3',
              activeFilter !== f && 'text-muted-foreground',
            )}
            onClick={() => setActiveFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Conversations List */}
      <div className='flex-1 overflow-y-auto scrollbar-thin'>
        {isLoading ? (
          <div className='flex items-center justify-center h-32'>
            <Loader2 className='h-6 w-6 animate-spin text-primary' />
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {filtered.map((conv, index) => {
              const otherUser = conv.isGroup
                ? null
                : conv.users.find((u) => u.id !== user?.id);
              const isOnline = otherUser
                ? onlineUsers.includes(otherUser.id)
                : false;

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <button
                    onClick={() => handleConversationClick(conv)}
                    className={cn(
                      'conversation-item w-full text-left',
                      activeConversation?.id === conv.id && 'active',
                    )}
                  >
                    <div className='relative shrink-0'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage src={conv.picture} />
                        <AvatarFallback>{conv.name[0]}</AvatarFallback>
                      </Avatar>
                      {isOnline && !conv.isGroup && (
                        <span className='absolute bottom-0 right-0 h-3 w-3 bg-status-online rounded-full border-2 border-sidebar' />
                      )}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-0.5'>
                        <h4 className='font-medium text-sm truncate'>{conv.name}</h4>
                        {conv.latestMessage && (
                          <span className='text-[11px] text-muted-foreground shrink-0 ml-2'>
                            {formatTime(conv.latestMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        <p className='text-xs text-muted-foreground truncate flex-1'>
                          {conv.latestMessage?.senderId === user?.id && (
                            <span className='text-primary'>You: </span>
                          )}
                          {conv.latestMessage?.isDeleted
                            ? 'This message was deleted'
                            : conv.latestMessage?.message || 'Start a conversation'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className='shrink-0 h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-medium bg-primary text-primary-foreground rounded-full'>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className='flex flex-col items-center justify-center h-48 text-muted-foreground'>
            <MessageCircle className='h-12 w-12 mb-2 opacity-50' />
            <p className='text-sm'>No conversations found</p>
          </div>
        )}
      </div>

      <CreateGroupModal open={showCreateGroup} onOpenChange={setShowCreateGroup} />
      <UserSearchModal open={showUserSearch} onOpenChange={setShowUserSearch} />
      <MessageSearchModal open={showMessageSearch} onOpenChange={setShowMessageSearch} />
    </div>
  );
}
