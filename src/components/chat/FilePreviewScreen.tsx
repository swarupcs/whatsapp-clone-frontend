import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Send, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getFileTypeInfo, formatFileSize, getFileCategory, generateVideoThumbnail } from '@/lib/fileUtils';
interface Props { isOpen: boolean; onClose: () => void; files: File[]; onSend: (files: File[], caption: string) => void; onAddMore: () => void; onRemove: (index: number) => void; }
export default function FilePreviewScreen({ isOpen, onClose, files, onSend, onAddMore, onRemove }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [isSending, setIsSending] = useState(false);
  useEffect(() => { if (files.length > 0 && activeIndex >= files.length) setActiveIndex(Math.max(0, files.length - 1)); }, [files.length, activeIndex]);
  useEffect(() => {
    files.forEach(async (file, i) => {
      if (previews[i]) return;
      const cat = getFileCategory(file.type);
      if (cat === 'IMAGE') setPreviews((p) => ({ ...p, [i]: URL.createObjectURL(file) }));
      else if (cat === 'VIDEO') { try { const t = await generateVideoThumbnail(file); setPreviews((p) => ({ ...p, [i]: t })); } catch {} }
    });
  }, [files]);
  if (!isOpen || files.length === 0) return null;
  const active = files[activeIndex]!;
  const info = getFileTypeInfo(active.type);
  const Icon = info.icon;
  const cat = getFileCategory(active.type);
  const handleSend = async () => { setIsSending(true); await new Promise((r) => setTimeout(r, 300)); onSend(files, caption); setCaption(''); setIsSending(false); };
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col'>
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <Button variant='ghost' size='icon' onClick={onClose}><X className='h-5 w-5' /></Button>
          <span className='font-medium'>{active.name}</span>
          <span className='text-sm text-muted-foreground'>{files.length > 1 && `${activeIndex + 1} / ${files.length}`}</span>
        </div>
        <div className='flex-1 relative flex items-center justify-center p-8 overflow-hidden'>
          {files.length > 1 && (<>
            <Button variant='ghost' size='icon' className={cn('absolute left-4 z-10 h-12 w-12 rounded-full bg-card/50', activeIndex === 0 && 'opacity-50 pointer-events-none')} onClick={() => setActiveIndex((p) => Math.max(0, p - 1))}><ChevronLeft className='h-6 w-6' /></Button>
            <Button variant='ghost' size='icon' className={cn('absolute right-4 z-10 h-12 w-12 rounded-full bg-card/50', activeIndex === files.length - 1 && 'opacity-50 pointer-events-none')} onClick={() => setActiveIndex((p) => Math.min(files.length - 1, p + 1))}><ChevronRight className='h-6 w-6' /></Button>
          </>)}
          <motion.div key={activeIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className='max-w-full max-h-full'>
            {cat === 'IMAGE' && previews[activeIndex] ? <img src={previews[activeIndex]} alt={active.name} className='max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl' />
              : cat === 'VIDEO' ? <video src={URL.createObjectURL(active)} controls className='max-h-[60vh] max-w-full rounded-lg shadow-2xl' />
              : <div className='flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border'><div className={cn('h-24 w-24 rounded-2xl flex items-center justify-center mb-4', info.color, 'bg-current/10')}><Icon className={cn('h-12 w-12', info.color)} /></div><h3 className='text-lg font-medium text-center mb-2'>{active.name}</h3><p className='text-sm text-muted-foreground'>{formatFileSize(active.size)}</p></div>}
          </motion.div>
        </div>
        {files.length > 1 && (
          <div className='px-4 py-3 border-t border-border'>
            <div className='flex gap-2 overflow-x-auto scrollbar-thin justify-center'>
              {files.map((f, i) => { const fi = getFileTypeInfo(f.type); const fc = getFileCategory(f.type); const FI = fi.icon; return (
                <button key={i} onClick={() => setActiveIndex(i)} className={cn('relative shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all group', activeIndex === i ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-muted-foreground')}>
                  {(fc === 'IMAGE' || fc === 'VIDEO') && previews[i] ? <img src={previews[i]} alt={f.name} className='h-full w-full object-cover' /> : <div className={cn('h-full w-full flex items-center justify-center bg-muted', fi.color)}><FI className='h-6 w-6' /></div>}
                  <button onClick={(e) => { e.stopPropagation(); onRemove(i); }} className='absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'><X className='h-3 w-3' /></button>
                </button>
              ); })}
              <button onClick={onAddMore} className='shrink-0 h-16 w-16 rounded-lg border-2 border-dashed border-border hover:border-primary flex items-center justify-center transition-colors'><Plus className='h-6 w-6 text-muted-foreground' /></button>
            </div>
          </div>
        )}
        <div className='p-4 border-t border-border bg-card/50 backdrop-blur-sm'>
          <div className='flex items-center gap-3 max-w-2xl mx-auto'>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') handleSend(); }} placeholder='Add a caption...' className='flex-1 h-12 bg-secondary border-0 rounded-full px-4' />
            <Button onClick={handleSend} disabled={isSending} className='h-12 w-12 rounded-full gradient-glow'>{isSending ? <Loader2 className='h-5 w-5 animate-spin' /> : <Send className='h-5 w-5' />}</Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
