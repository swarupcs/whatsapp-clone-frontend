import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getFileTypeInfo,
  formatFileSize,
  getFileCategory,
} from '@/lib/fileUtils';
import { cn } from '@/lib/utils';

interface AttachmentPreviewProps {
  attachments: File[];
  onRemove: (index: number) => void;
}

export default function AttachmentPreview({
  attachments,
  onRemove,
}: AttachmentPreviewProps) {
  return (
    <div className='px-4 py-2 border-t border-border bg-card/50'>
      <div className='flex gap-2 overflow-x-auto scrollbar-thin pb-2'>
        {attachments.map((file, index) => {
          const fileInfo = getFileTypeInfo(file.type);
          const FileIcon = fileInfo.icon;
          const category = getFileCategory(file.type);
          const isImage = category === 'IMAGE';
          const isVideo = category === 'VIDEO';

          return (
            <div
              key={index}
              className='relative shrink-0 h-16 w-16 rounded-lg bg-muted flex items-center justify-center group overflow-hidden'
            >
              {isImage ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className='h-full w-full object-cover'
                />
              ) : isVideo ? (
                <video
                  src={URL.createObjectURL(file)}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div
                  className={cn(
                    'flex flex-col items-center justify-center',
                    fileInfo.color,
                  )}
                >
                  <FileIcon className='h-6 w-6' />
                  <span className='text-[8px] mt-1 text-center truncate max-w-full px-1'>
                    {file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <Button
                size='icon'
                variant='destructive'
                className='absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                onClick={() => onRemove(index)}
              >
                <X className='h-3 w-3' />
              </Button>
            </div>
          );
        })}
      </div>
      <p className='text-xs text-muted-foreground mt-1'>
        {attachments.length} file{attachments.length > 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
