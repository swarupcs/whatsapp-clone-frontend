import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Pencil, Trash2, X, Check, Forward, Reply, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
interface Props { messageId: string; messageText: string; isOwn: boolean; isPinned?: boolean; onEdit: (id: string, text: string) => void; onDelete: (id: string) => void; onForward: (id: string) => void; onReply: (id: string) => void; onPin: (id: string) => void; onUnpin: (id: string) => void; isVisible: boolean; }
export default function MessageActions({ messageId, messageText, isOwn, isPinned, onEdit, onDelete, onForward, onReply, onPin, onUnpin, isVisible }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(messageText);
  const handleSave = () => { if (editValue.trim() && editValue !== messageText) onEdit(messageId, editValue.trim()); setIsEditing(false); };
  const handleCancel = () => { setEditValue(messageText); setIsEditing(false); };
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } if (e.key === 'Escape') handleCancel(); };
  if (isEditing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='absolute inset-0 flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-2xl px-3 py-2 z-20'>
        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleKey} className='flex-1 h-8 text-sm bg-secondary border-0' autoFocus />
        <Button size='icon' variant='ghost' className='h-7 w-7 text-primary' onClick={handleSave}><Check className='h-4 w-4' /></Button>
        <Button size='icon' variant='ghost' className='h-7 w-7 text-muted-foreground hover:text-destructive' onClick={handleCancel}><X className='h-4 w-4' /></Button>
      </motion.div>
    );
  }
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          className={cn('absolute top-1/2 -translate-y-1/2 z-10', isOwn ? '-left-16' : '-right-16')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='ghost' className='h-7 w-7 rounded-full bg-card border border-border shadow-sm hover:bg-muted'>
                <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? 'end' : 'start'} className='w-32'>
              <DropdownMenuItem onClick={() => onReply(messageId)} className='gap-2'><Reply className='h-4 w-4' />Reply</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onForward(messageId)} className='gap-2'><Forward className='h-4 w-4' />Forward</DropdownMenuItem>
              <DropdownMenuItem onClick={() => isPinned ? onUnpin(messageId) : onPin(messageId)} className='gap-2'>
                {isPinned ? <PinOff className='h-4 w-4' /> : <Pin className='h-4 w-4' />}{isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              {isOwn && (<>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setEditValue(messageText); setIsEditing(true); }} className='gap-2'><Pencil className='h-4 w-4' />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(messageId)} className='gap-2 text-destructive focus:text-destructive'><Trash2 className='h-4 w-4' />Delete</DropdownMenuItem>
              </>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
