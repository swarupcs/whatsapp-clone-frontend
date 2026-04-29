import { setActiveConversation } from '@/store/slices/chatSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Search,
  MoreVertical,
  MessageCircle,
  Users,
  Settings,
  LogOut,
  Plus,
  FileSearch,
  Loader2,
  Pin,
  BellOff,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import {
  useConversations,
  useMarkRead,
} from '@/hooks/queries/useConversations';
import { useLogout } from '@/hooks/queries/useAuth';
import CreateGroupModal from './CreateGroupModal';
import UserSearchModal from './UserSearchModal';
import MessageSearchModal from './MessageSearchModal';
import SwiftChatLogo from '@/components/shared/SwiftChatLogo';
import ThemeToggle from '@/components/shared/ThemeToggle';
import StatusDot from '@/components/shared/StatusDot';
import type { Conversation } from '@/types';

interface Props {
  onConversationSelect?: () => void;
}

// Generate a deterministic gradient color for avatars based on user/group name
function getAvatarGradient(name: string): string {
  const gradients = [
    'from-orange-400 to-rose-500',
    'from-violet-400 to-purple-600',
    'from-sky-400 to-blue-600',
    'from-emerald-400 to-teal-600',
    'from-amber-400 to-orange-600',
    'from-pink-400 to-violet-600',
    'from-cyan-400 to-sky-600',
    'from-rose-400 to-pink-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

const filters = ['all', 'unread', 'groups', 'archived'] as const;
type Filter = typeof filters[number];

export default function ChatSidebar({ onConversationSelect }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const activeConversation = useAppSelector((state) => state.chat.activeConversation);
  const onlineUsers = useAppSelector((state) => state.chat.onlineUsers);
  const dispatch = useAppDispatch();

  const { data: conversations = [], isLoading } = useConversations();
  const logoutMutation = useLogout();
  const markRead = useMarkRead();

  let filtered = conversations.filter((conv) => {
    const matchesSearch = conv.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'unread') return conv.unreadCount > 0;
    if (activeFilter === 'groups') return conv.isGroup;
    return true;
  });

  if (
    activeConversation &&
    activeConversation.id.startsWith('virtual_') &&
    searchQuery === '' &&
    activeFilter === 'all'
  ) {
    if (!filtered.some((c) => c.id === activeConversation.id)) {
      filtered = [activeConversation, ...filtered];
    }
  }

  const handleConversationClick = (conv: Conversation) => {
    dispatch(setActiveConversation(conv));
    onConversationSelect?.();
    if (conv.unreadCount > 0) markRead.mutate(conv.id);
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

  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.latestMessage) return 'Start a conversation';
    if (conv.latestMessage.isDeleted) return 'This message was deleted';
    if (
      conv.latestMessage.files &&
      conv.latestMessage.files.length > 0 &&
      !conv.latestMessage.message
    )
      return `📎 ${conv.latestMessage.files.length} attachment${conv.latestMessage.files.length > 1 ? 's' : ''}`;
    return conv.latestMessage.message || 'Start a conversation';
  };

  const getLastMessageSender = (conv: Conversation): string | null => {
    if (!conv.latestMessage || !conv.isGroup) return null;
    if (conv.latestMessage.senderId === user?.id) return 'You';
    const sender = conv.users.find(
      (u) => u.id === conv.latestMessage?.senderId,
    );
    return sender?.name.split(' ')[0] ?? null;
  };

  return (
    <div className='chat-sidebar'>
      {/* Header */}
      <div className='h-16 px-4 flex items-center justify-between border-b border-border'>
        <SwiftChatLogo size='sm' />
        <div className='flex items-center gap-1'>
          <ThemeToggle />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:text-foreground rounded-xl'
              onClick={() => setShowUserSearch(true)}
              aria-label='New chat'
            >
              <Plus className='h-5 w-5' />
            </Button>
          </motion.div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground rounded-xl'
                aria-label='More options'
              >
                <MoreVertical className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48 rounded-xl border-border/50'>
              <DropdownMenuItem onClick={() => setShowCreateGroup(true)} className='rounded-lg'>
                <Users className='mr-2 h-4 w-4' /> New group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowUserSearch(true)} className='rounded-lg'>
                <MessageCircle className='mr-2 h-4 w-4' /> New chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowMessageSearch(true)} className='rounded-lg'>
                <FileSearch className='mr-2 h-4 w-4' /> Search messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className='rounded-lg'>
                <Settings className='mr-2 h-4 w-4' /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className='rounded-lg'>
                <Settings className='mr-2 h-4 w-4' /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className='text-destructive focus:text-destructive rounded-lg'
              >
                <LogOut className='mr-2 h-4 w-4' /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className='p-3'>
        <div className='relative'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search or start new chat'
            className='pl-11 h-10 bg-secondary border-0 rounded-xl'
            aria-label='Search conversations'
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className='px-3 pb-2 flex gap-1.5'>
        {filters.map((f) => (
          <Button
            key={f}
            variant='ghost'
            size='sm'
            className={cn(
              'rounded-full text-xs h-7 px-3 transition-all',
              activeFilter === f
                ? 'gradient-primary text-white font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
            onClick={() => setActiveFilter(f)}
            aria-label={`Filter: ${f}`}
          >
            {f === 'archived' ? (
              <><Archive className='h-3 w-3 mr-1' />{f.charAt(0).toUpperCase() + f.slice(1)}</>
            ) : (
              f.charAt(0).toUpperCase() + f.slice(1)
            )}
          </Button>
        ))}
      </div>

      {/* Conversation list */}
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
              const lastMessageSender = getLastMessageSender(conv);
              const preview = getLastMessagePreview(conv);
              const isActive = activeConversation?.id === conv.id;
              const gradient = getAvatarGradient(conv.name);

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03, duration: 0.25 }}
                >
                  <button
                    onClick={() => handleConversationClick(conv)}
                    className={cn(
                      'conversation-item w-full text-left',
                      isActive && 'active',
                    )}
                    aria-label={`Open chat with ${conv.name}`}
                  >
                    <div className='relative shrink-0'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage src={conv.picture} />
                        <AvatarFallback className={cn('bg-gradient-to-br text-white font-semibold', gradient)}>
                          {conv.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && !conv.isGroup && (
                        <StatusDot status='online' size='md' className='absolute bottom-0 right-0' />
                      )}
                      {conv.isGroup && (
                        <span className='absolute bottom-0 right-0 h-4 w-4 bg-brand-violet/20 rounded-full border-2 border-sidebar flex items-center justify-center'>
                          <Users className='h-2 w-2 text-brand-violet' />
                        </span>
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-0.5'>
                        <h4 className='font-semibold text-sm truncate'>
                          {conv.name}
                        </h4>
                        {conv.latestMessage && (
                          <span
                            className={cn(
                              'text-[11px] shrink-0 ml-2',
                              conv.unreadCount > 0
                                ? 'text-primary font-semibold'
                                : 'text-muted-foreground',
                            )}
                          >
                            {formatTime(conv.latestMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        <p className='text-xs text-muted-foreground truncate flex-1'>
                          {lastMessageSender && (
                            <span className='text-foreground/70'>
                              {lastMessageSender}:{' '}
                            </span>
                          )}
                          {!lastMessageSender &&
                            conv.latestMessage?.senderId === user?.id && (
                              <span className='text-primary'>You: </span>
                            )}
                          {preview}
                        </p>
                        {conv.unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className='unread-badge'
                          >
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </motion.span>
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
            <MessageCircle className='h-12 w-12 mb-3 opacity-30' />
            <p className='text-sm font-medium'>No conversations found</p>
            <p className='text-xs text-muted-foreground/60 mt-1'>Start a new chat to begin</p>
          </div>
        )}
      </div>

      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
      />
      <UserSearchModal open={showUserSearch} onOpenChange={setShowUserSearch} />
      <MessageSearchModal
        open={showMessageSearch}
        onOpenChange={setShowMessageSearch}
      />
    </div>
  );
}
