import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFileTypeInfo, formatFileSize, getFileCategory } from '@/lib/fileUtils';
import { cn } from '@/lib/utils';
interface Props { attachments: File[]; onRemove: (index: number) => void; }
export default function AttachmentPreview({ attachments, onRemove }: Props) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  useEffect(() => {
    const newPreviews = attachments.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews(newPreviews);
    return () => { newPreviews.forEach(({ url }) => URL.revokeObjectURL(url)); };
  }, [attachments]);
  return (
    <div className='px-4 py-2 border-t border-border bg-card/50'>
      <div className='flex gap-2 overflow-x-auto scrollbar-thin pb-2'>
        {previews.map(({ file, url }, index) => {
          const info = getFileTypeInfo(file.type);
          const Icon = info.icon;
          const cat = getFileCategory(file.type);
          const isImage = cat === 'IMAGE';
          const isVideo = cat === 'VIDEO';
          return (
            <div key={`${file.name}-${index}`} className='relative shrink-0 h-16 w-16 rounded-lg bg-muted flex items-center justify-center group overflow-hidden'>
              {isImage ? <img src={url} alt={file.name} className='h-full w-full object-cover' />
                : isVideo ? <video src={url} className='h-full w-full object-cover' />
                : <div className={cn('flex flex-col items-center justify-center', info.color)}><Icon className='h-6 w-6' /><span className='text-[8px] mt-1 truncate max-w-full px-1'>{file.name.split('.').pop()?.toUpperCase()}</span></div>}
              <Button size='icon' variant='destructive' className='absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity' onClick={() => onRemove(index)}>
                <X className='h-3 w-3' />
              </Button>
            </div>
          );
        })}
      </div>
      <p className='text-xs text-muted-foreground mt-1'>{attachments.length} file{attachments.length > 1 ? 's' : ''} selected</p>
    </div>
  );
}
