import { motion } from 'framer-motion';

const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍',
  '🤩','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','😐','😑',
  '😶','😏','😒','🙄','😬','😌','😔','😪','😴','😷','🤒','🤕','🤢','🤮','🥵',
  '🥶','😵','🤯','🤠','🥳','😎','🤓','🧐','❤️','🧡','💛','💚','💙','💜','🖤',
  '👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👋','🙏','💪','🎉','🎊','🔥','⭐',
  '✨','💯','💥','💫','🌟',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className='absolute bottom-20 left-4 z-50 p-3 rounded-xl bg-card border border-border shadow-lg'
    >
      <div className='grid grid-cols-10 gap-1 max-h-48 overflow-y-auto scrollbar-thin'>
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); }}
            className='h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors'
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
