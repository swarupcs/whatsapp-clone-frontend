import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const QUICK = ['👍','❤️','😂','😮','😢','🙏'];
const FULL = ['👍','👎','❤️','🧡','💛','💚','💙','💜','😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😋','😛','😜','🤪','😝','🤗','🤔','🤐','😏','😒','🙄','😬','😌','😔','😪','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','😵','🤯','🤠','🥳','😎','🤓','🧐','😱','😨','😰','😥','😢','😭','😤','😡','🤬','🙏','👏','🤝','👋','✌️','🤞','🤟','🤘','💪','🎉','🎊','🔥','⭐','✨','💯','💥'];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export default function ReactionPicker({ onSelect, onClose, position = 'top' }: Props) {
  const [showFull, setShowFull] = useState(false);
  const handle = (e: string) => { onSelect(e); onClose(); };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`absolute z-50 ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0`}
    >
      {showFull ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className='grid grid-cols-8 gap-1 p-3 max-h-48 overflow-y-auto scrollbar-thin rounded-xl bg-card border border-border shadow-lg'>
          {FULL.map((e) => (
            <button key={e} onClick={() => handle(e)}
              className='h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded-lg transition-colors'>
              {e}
            </button>
          ))}
        </motion.div>
      ) : (
        <div className='bg-card rounded-full px-2 py-1.5 shadow-lg border border-border flex items-center gap-1'>
          {QUICK.map((e) => (
            <button key={e} onClick={() => handle(e)}
              className='h-8 w-8 flex items-center justify-center text-lg hover:scale-125 transition-transform'>
              {e}
            </button>
          ))}
          <button onClick={() => setShowFull(true)}
            className='h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors'>
            <Plus className='h-4 w-4' />
          </button>
        </div>
      )}
    </motion.div>
  );
}
