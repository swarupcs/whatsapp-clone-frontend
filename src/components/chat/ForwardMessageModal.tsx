import { useState } from 'react';
import { Search, Forward } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversations } from '@/hooks/queries/useConversations';
import { useForwardMessage } from '@/hooks/queries/useMessages';
import { useChatStore } from '@/store/chatStore';
import type { Message } from '@/types';
interface Props { isOpen: boolean; onClose: () => void; message: Message | null; }
export default function ForwardMessageModal({ isOpen, onClose, message }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const { activeConversation } = useChatStore();
  const { data: conversations = [] } = useConversations();
  const forwardMutation = useForwardMessage(activeConversation?.id ?? '');
  const filtered = conversations.filter((c) => c.id !== activeConversation?.id).filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const toggle = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const handleForward = async () => {
    if (!message) return;
    await Promise.all(selected.map((convId) => forwardMutation.mutateAsync({ messageId: message.id, toConversationId: convId })));
    setSelected([]); setSearchQuery(''); onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={() => { setSelected([]); setSearchQuery(''); onClose(); }}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader><DialogTitle className='flex items-center gap-2'><Forward className='h-5 w-5' /> Forward Message</DialogTitle></DialogHeader>
        {message && (
          <div className='p-3 rounded-lg bg-secondary/50 border border-border'>
            <p className='text-xs text-muted-foreground mb-1'>Message to forward:</p>
            <p className='text-sm line-clamp-3'>{message.message}</p>
            {message.files && message.files.length > 0 && <p className='text-xs text-muted-foreground mt-1'>+ {message.files.length} attachment(s)</p>}
          </div>
        )}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder='Search conversations...' className='pl-9' />
        </div>
        <ScrollArea className='h-[300px] -mx-6 px-6'>
          <div className='space-y-1'>
            {filtered.length === 0 ? <p className='text-center text-muted-foreground py-8'>No conversations found</p> : filtered.map((conv) => (
              <AnimatePresence key={conv.id}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={cn('flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors', selected.includes(conv.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary')}
                  onClick={() => toggle(conv.id)}>
                  <Avatar className='h-10 w-10'><AvatarImage src={conv.picture} /><AvatarFallback>{conv.name[0]}</AvatarFallback></Avatar>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium truncate'>{conv.name}</p>
                    <p className='text-xs text-muted-foreground'>{conv.isGroup ? `${conv.users.length} members` : 'Direct message'}</p>
                  </div>
                  <Checkbox checked={selected.includes(conv.id)} className='pointer-events-none' />
                </motion.div>
              </AnimatePresence>
            ))}
          </div>
        </ScrollArea>
        <div className='flex items-center justify-between pt-4 border-t border-border'>
          <p className='text-sm text-muted-foreground'>{selected.length > 0 ? `${selected.length} selected` : 'Select conversations'}</p>
          <Button onClick={handleForward} disabled={selected.length === 0 || forwardMutation.isPending} className='gap-2'>
            <Forward className='h-4 w-4' />Forward{selected.length > 1 ? ` to ${selected.length}` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
