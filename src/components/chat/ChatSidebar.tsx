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
  Filter,
  FileSearch,
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
import CreateGroupModal from './CreateGroupModal';
import UserSearchModal from './UserSearchModal';
import MessageSearchModal from './MessageSearchModal';
import { useChatStore } from '@/store/chatStore';

interface ChatSidebarProps {
  onConversationSelect?: () => void;
}

export default function ChatSidebar({
  onConversationSelect,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>(
    'all',
  );
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);

  const {
    user,
    conversations,
    activeConversation,
    setActiveConversation,
    logout,
    onlineUsers,
  } = useChatStore();

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'unread':
        return conv.unreadCount > 0;
      case 'groups':
        return conv.isGroup;
      default:
        return true;
    }
  });

  const handleConversationClick = (conv: Conversation) => {
    setActiveConversation(conv);
    onConversationSelect?.();
  };

  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'dd/MM/yy');
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
            <p className='text-xs text-muted-foreground capitalize'>
              {user?.status}
            </p>
          </div>
        </button>

        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-foreground'
            onClick={() => setShowMessageSearch(true)}
            title='Search messages'
          >
            <FileSearch className='h-5 w-5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-foreground'
            onClick={() => setShowUserSearch(true)}
          >
            <Plus className='h-5 w-5' />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground'
              >
                <MoreVertical className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                <Users className='mr-2 h-4 w-4' />
                New group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowUserSearch(true)}>
                <MessageCircle className='mr-2 h-4 w-4' />
                New chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className='mr-2 h-4 w-4' />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className='text-destructive'>
                <LogOut className='mr-2 h-4 w-4' />
                Log out
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
        <Button
          variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
          size='sm'
          className='rounded-full text-xs h-7 px-3'
          onClick={() => setActiveFilter('all')}
        >
          All
        </Button>
        <Button
          variant={activeFilter === 'unread' ? 'secondary' : 'ghost'}
          size='sm'
          className={cn(
            'rounded-full text-xs h-7 px-3',
            activeFilter !== 'unread' && 'text-muted-foreground',
          )}
          onClick={() => setActiveFilter('unread')}
        >
          Unread
        </Button>
        <Button
          variant={activeFilter === 'groups' ? 'secondary' : 'ghost'}
          size='sm'
          className={cn(
            'rounded-full text-xs h-7 px-3',
            activeFilter !== 'groups' && 'text-muted-foreground',
          )}
          onClick={() => setActiveFilter('groups')}
        >
          Groups
        </Button>
      </div>

      {/* Conversations List */}
      <div className='flex-1 overflow-y-auto scrollbar-thin'>
        <AnimatePresence mode='popLayout'>
          {filteredConversations.map((conv, index) => {
            const otherUser = conv.users.find((u) => u.id !== user?.id);
            const isOnline = otherUser && onlineUsers.includes(otherUser.id);

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
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
                      <h4 className='font-medium text-sm truncate'>
                        {conv.name}
                      </h4>
                      {conv.latestMessage && (
                        <span className='text-[11px] text-muted-foreground shrink-0 ml-2'>
                          {formatTime(new Date(conv.latestMessage.createdAt))}
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <p className='text-xs text-muted-foreground truncate flex-1'>
                        {conv.latestMessage?.senderId === user?.id && (
                          <span className='text-primary'>You: </span>
                        )}
                        {conv.latestMessage?.message || 'Start a conversation'}
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

        {filteredConversations.length === 0 && (
          <div className='flex flex-col items-center justify-center h-48 text-muted-foreground'>
            <MessageCircle className='h-12 w-12 mb-2 opacity-50' />
            <p className='text-sm'>No conversations found</p>
          </div>
        )}
      </div>

      {/* Modals */}
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
