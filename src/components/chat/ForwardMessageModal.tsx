import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Forward, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { type Message, type Conversation, useChatStore } from '@/store/chatStore';
import { cn } from '@/lib/utils';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
}

export default function ForwardMessageModal({
  isOpen,
  onClose,
  message,
}: ForwardMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversations, setSelectedConversations] = useState<string[]>(
    [],
  );

  const { conversations, forwardMessage, activeConversation } = useChatStore();

  // Filter out current conversation and search
  const filteredConversations = conversations
    .filter((conv) => conv.id !== activeConversation?.id)
    .filter((conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const toggleConversation = (convId: string) => {
    setSelectedConversations((prev) =>
      prev.includes(convId)
        ? prev.filter((id) => id !== convId)
        : [...prev, convId],
    );
  };

  const handleForward = () => {
    if (!message || selectedConversations.length === 0) return;

    selectedConversations.forEach((convId) => {
      forwardMessage(message.id, convId);
    });

    setSelectedConversations([]);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSelectedConversations([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Forward className='h-5 w-5' />
            Forward Message
          </DialogTitle>
        </DialogHeader>

        {/* Message Preview */}
        {message && (
          <div className='p-3 rounded-lg bg-secondary/50 border border-border'>
            <p className='text-xs text-muted-foreground mb-1'>
              Message to forward:
            </p>
            <p className='text-sm line-clamp-3'>{message.message}</p>
            {message.files && message.files.length > 0 && (
              <p className='text-xs text-muted-foreground mt-1'>
                + {message.files.length} attachment(s)
              </p>
            )}
          </div>
        )}

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search conversations...'
            className='pl-9'
          />
        </div>

        {/* Conversation List */}
        <ScrollArea className='h-[300px] -mx-6 px-6'>
          <div className='space-y-1'>
            {filteredConversations.length === 0 ? (
              <p className='text-center text-muted-foreground py-8'>
                No conversations found
              </p>
            ) : (
              filteredConversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    selectedConversations.includes(conv.id)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-secondary',
                  )}
                  onClick={() => toggleConversation(conv.id)}
                >
                  <div className='relative'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={conv.picture} />
                      <AvatarFallback>{conv.name[0]}</AvatarFallback>
                    </Avatar>
                    {!conv.isGroup && conv.users[1]?.status === 'online' && (
                      <span className='absolute bottom-0 right-0 h-3 w-3 bg-status-online rounded-full border-2 border-background' />
                    )}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <p className='font-medium truncate'>{conv.name}</p>
                    <p className='text-xs text-muted-foreground truncate'>
                      {conv.isGroup
                        ? `${conv.users.length} members`
                        : conv.users[1]?.about || 'Click to select'}
                    </p>
                  </div>

                  <Checkbox
                    checked={selectedConversations.includes(conv.id)}
                    className='pointer-events-none'
                  />
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className='flex items-center justify-between pt-4 border-t border-border'>
          <p className='text-sm text-muted-foreground'>
            {selectedConversations.length > 0
              ? `${selectedConversations.length} selected`
              : 'Select conversations'}
          </p>
          <Button
            onClick={handleForward}
            disabled={selectedConversations.length === 0}
            className='gap-2'
          >
            <Forward className='h-4 w-4' />
            Forward
            {selectedConversations.length > 1
              ? ` to ${selectedConversations.length}`
              : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
