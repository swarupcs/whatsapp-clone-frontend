import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  imageName,
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setZoom(1);
    setRotation(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent shadow-none overflow-hidden'>
        <div className='relative flex flex-col items-center'>
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg'
          >
            <Button
              variant='ghost'
              size='icon'
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className='h-8 w-8 text-muted-foreground hover:text-foreground'
            >
              <ZoomOut className='h-4 w-4' />
            </Button>
            <span className='text-sm font-medium min-w-[3rem] text-center'>
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className='h-8 w-8 text-muted-foreground hover:text-foreground'
            >
              <ZoomIn className='h-4 w-4' />
            </Button>
            <div className='w-px h-5 bg-border' />
            <Button
              variant='ghost'
              size='icon'
              onClick={handleRotate}
              className='h-8 w-8 text-muted-foreground hover:text-foreground'
            >
              <RotateCw className='h-4 w-4' />
            </Button>
            <div className='w-px h-5 bg-border' />
            <Button
              variant='ghost'
              size='icon'
              onClick={handleDownload}
              className='h-8 w-8 text-muted-foreground hover:text-foreground'
            >
              <Download className='h-4 w-4' />
            </Button>
          </motion.div>

          {/* Image Container */}
          <div className='flex items-center justify-center w-full h-[80vh] overflow-auto'>
            <motion.img
              src={imageUrl}
              alt={imageName}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: zoom,
                rotate: rotation,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className='max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing'
              draggable={false}
            />
          </div>

          {/* Image Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border'
          >
            <span className='text-sm text-muted-foreground truncate max-w-[300px] block'>
              {imageName}
            </span>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
