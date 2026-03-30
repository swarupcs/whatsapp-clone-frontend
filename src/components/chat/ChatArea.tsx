import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  Phone,
  Video,
  Search,
  ArrowLeft,
  Image as ImageIcon,
  File,
  Check,
  CheckCheck,
  SmilePlus,
  Pencil,
  Pin,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type {
  Message,
  User,
  FileAttachment,
  Conversation,
} from '@/store/chatStore';
import { cn } from '@/lib/utils';
import EmojiPicker from './EmojiPicker';
import AttachmentPreview from './AttachmentPreview';
import ReactionPicker from './ReactionPicker';
import MessageReactions from './MessageReactions';
import ImagePreviewModal from './ImagePreviewModal';
import VideoCallModal from './VideoCallModal';
import AudioCallModal from './AudioCallModal';
import ReadReceipts from './ReadReceipts';
import TypingIndicator from './TypingIndicator';
import MessageActions from './MessageActions';
import UndoToast from './UndoToast';
import ForwardMessageModal from './ForwardMessageModal';
import ReplyPreview from './ReplyPreview';
import QuotedMessage from './QuotedMessage';
import PinnedMessagesBar from './PinnedMessagesBar';
import ConversationSearch, { HighlightedText } from './ConversationSearch';
import FilePreviewScreen from './FilePreviewScreen';
import VoiceRecorder from './VoiceRecorder';
import AudioMessage from './AudioMessage';
import { useChatStore, type Message as MessageType } from '@/store/chatStore';
import {
  getFileTypeInfo,
  formatFileSize,
  getFileCategory,
  getAcceptedFileTypes,
} from '@/lib/fileUtils';

interface ChatAreaProps {
  onBack?: () => void;
}

export default function ChatArea({ onBack }: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [previewImage, setPreviewImage] = useState<FileAttachment | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [forwardingMessage, setForwardingMessage] =
    useState<MessageType | null>(null);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  const {
    activeConversation,
    messages,
    user,
    sendMessage,
    typingUsers,
    addReaction,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
  } = useChatStore();

  const otherUser = activeConversation?.users.find((u) => u.id !== user?.id);

  // Get users who are currently typing (excluding current user)
  const typingUserIds = activeConversation
    ? typingUsers[activeConversation.id] || []
    : [];
  const typingUsersList = activeConversation
    ? activeConversation.users.filter(
        (u) => typingUserIds.includes(u.id) && u.id !== user?.id,
      )
    : [];
  const isOtherTyping = typingUsersList.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;

    sendMessage(
      message.trim(),
      attachments.length > 0 ? attachments : undefined,
      replyingTo
        ? {
            messageId: replyingTo.id,
            senderId: replyingTo.senderId,
            senderName:
              activeConversation?.users.find(
                (u) => u.id === replyingTo.senderId,
              )?.name || 'Unknown',
            message: replyingTo.message,
          }
        : undefined,
    );
    setMessage('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    // Show file preview screen when files are selected
    if (files.length > 0) {
      setShowFilePreview(true);
    }
  };

  const handleAdditionalFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = prev.filter((_, i) => i !== index);
      if (newAttachments.length === 0) {
        setShowFilePreview(false);
      }
      return newAttachments;
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  const handleImageClick = (file: FileAttachment) => {
    setPreviewImage(file);
  };

  const handleForward = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      setForwardingMessage(msg);
    }
  };

  const handleReply = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      setReplyingTo(msg);
    }
  };

  const handleSendWithReply = () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!activeConversation || !user) return;

    const replyData = replyingTo
      ? {
          messageId: replyingTo.id,
          senderId: replyingTo.senderId,
          senderName:
            activeConversation.users.find((u) => u.id === replyingTo.senderId)
              ?.name || 'Unknown',
          message: replyingTo.message,
        }
      : undefined;

    sendMessage(
      message.trim(),
      attachments.length > 0 ? attachments : undefined,
      replyData,
    );
    setMessage('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setReplyingTo(null);
  };

  const handleFileSend = (files: File[], caption: string) => {
    if (!activeConversation || !user) return;

    const replyData = replyingTo
      ? {
          messageId: replyingTo.id,
          senderId: replyingTo.senderId,
          senderName:
            activeConversation.users.find((u) => u.id === replyingTo.senderId)
              ?.name || 'Unknown',
          message: replyingTo.message,
        }
      : undefined;

    sendMessage(caption, files, replyData);
    setAttachments([]);
    setShowFilePreview(false);
    setReplyingTo(null);
  };

  const handleVoiceRecordingComplete = (blob: Blob | null) => {
    if (blob && activeConversation && user) {
      // Create a file from the blob using Object.assign to work around TypeScript
      const file = Object.assign(blob, {
        name: `voice-message-${Date.now()}.webm`,
        lastModified: Date.now(),
      }) as unknown as File;
      sendMessage('', [file], undefined);
    }
    setIsRecording(false);
  };

  if (!activeConversation) {
    return (
      <div className='flex-1 flex items-center justify-center bg-background'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center space-y-4'
        >
          <div className='h-24 w-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center'>
            <Send className='h-12 w-12 text-primary' />
          </div>
          <h2 className='text-2xl font-semibold'>WhatsUp Web</h2>
          <p className='text-muted-foreground max-w-sm'>
            Select a conversation to start chatting or search for someone to
            message.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col h-full bg-background relative'>
      {/* Header */}
      <div className='h-16 px-4 flex items-center gap-3 border-b border-border bg-card/50 backdrop-blur-sm relative z-10'>
        {onBack && (
          <Button
            variant='ghost'
            size='icon'
            onClick={onBack}
            className='lg:hidden'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
        )}

        <div className='relative'>
          <Avatar className='h-10 w-10'>
            <AvatarImage src={activeConversation.picture} />
            <AvatarFallback>{activeConversation.name[0]}</AvatarFallback>
          </Avatar>
          {otherUser?.status === 'online' && (
            <span className='absolute bottom-0 right-0 h-3 w-3 bg-status-online rounded-full border-2 border-card' />
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <h3 className='font-semibold truncate'>{activeConversation.name}</h3>
          <AnimatePresence mode='wait'>
            {isOtherTyping ? (
              <motion.p
                key='typing'
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className='text-xs text-primary flex items-center gap-1'
              >
                <span>
                  {typingUsersList.length === 1
                    ? `${typingUsersList[0].name.split(' ')[0]} is typing`
                    : activeConversation.isGroup
                      ? `${typingUsersList.length} people typing`
                      : 'typing'}
                </span>
                <span className='flex gap-0.5'>
                  <motion.span
                    className='w-1 h-1 rounded-full bg-primary'
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <motion.span
                    className='w-1 h-1 rounded-full bg-primary'
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span
                    className='w-1 h-1 rounded-full bg-primary'
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  />
                </span>
              </motion.p>
            ) : (
              <motion.p
                key='status'
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className='text-xs text-muted-foreground'
              >
                {activeConversation.isGroup
                  ? `${activeConversation.users.length} members`
                  : otherUser?.status === 'online'
                    ? 'online'
                    : 'offline'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-foreground'
            onClick={() => setShowVideoCall(true)}
          >
            <Video className='h-5 w-5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-foreground'
            onClick={() => setShowAudioCall(true)}
          >
            <Phone className='h-5 w-5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'text-muted-foreground hover:text-foreground',
              showSearch && 'text-primary',
            )}
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className='h-5 w-5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-foreground'
          >
            <MoreVertical className='h-5 w-5' />
          </Button>
        </div>
      </div>

      {/* Conversation Search */}
      <ConversationSearch
        isOpen={showSearch}
        onClose={() => {
          setShowSearch(false);
          setSearchQuery('');
        }}
        messages={messages.filter((m) => !m.isDeleted)}
        onNavigateToMessage={(messageId) => {
          const element = document.getElementById(`message-${messageId}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Briefly highlight the message
          element?.classList.add('ring-2', 'ring-primary');
          setTimeout(() => {
            element?.classList.remove('ring-2', 'ring-primary');
          }, 2000);
        }}
        currentUserId={user?.id || ''}
      />

      {/* Pinned Messages Bar */}
      <AnimatePresence>
        {messages.filter((m) => m.isPinned && !m.isDeleted).length > 0 && (
          <PinnedMessagesBar
            pinnedMessages={messages
              .filter((m) => m.isPinned && !m.isDeleted)
              .sort(
                (a, b) =>
                  new Date(b.pinnedAt || 0).getTime() -
                  new Date(a.pinnedAt || 0).getTime(),
              )}
            users={activeConversation.users}
            currentUserId={user?.id || ''}
            onUnpin={unpinMessage}
            onScrollToMessage={(messageId) => {
              const element = document.getElementById(`message-${messageId}`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin'>
        <AnimatePresence initial={false}>
          {messages
            .filter((msg) => !msg.isDeleted)
            .map((msg, index) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
                showAvatar={
                  index === 0 ||
                  messages.filter((m) => !m.isDeleted)[index - 1]?.senderId !==
                    msg.senderId
                }
                sender={activeConversation.users.find(
                  (u) => u.id === msg.senderId,
                )}
                currentUserId={user?.id || ''}
                onReaction={(emoji) => addReaction(msg.id, emoji)}
                onImageClick={handleImageClick}
                onEdit={editMessage}
                onDelete={deleteMessage}
                onForward={handleForward}
                onReply={handleReply}
                onPin={pinMessage}
                onUnpin={unpinMessage}
                conversation={activeConversation}
              />
            ))}
        </AnimatePresence>

        <AnimatePresence>
          {isOtherTyping && (
            <TypingIndicator
              typingUsers={typingUsersList}
              showAvatars={
                activeConversation.isGroup || typingUsersList.length > 0
              }
            />
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <AttachmentPreview
          attachments={attachments}
          onRemove={removeAttachment}
        />
      )}

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <ReplyPreview
            senderName={
              activeConversation.users.find((u) => u.id === replyingTo.senderId)
                ?.name || 'Unknown'
            }
            message={replyingTo.message}
            isOwn={replyingTo.senderId === user?.id}
            onCancel={() => setReplyingTo(null)}
          />
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className='p-4 border-t border-border bg-card/50 backdrop-blur-sm'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-foreground shrink-0'
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className='h-5 w-5' />
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-foreground shrink-0'
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className='h-5 w-5' />
          </Button>

          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={getAcceptedFileTypes()}
            multiple
            className='hidden'
          />

          <input
            type='file'
            ref={additionalFileInputRef}
            onChange={handleAdditionalFileSelect}
            accept={getAcceptedFileTypes()}
            multiple
            className='hidden'
          />

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='Type a message...'
            className='flex-1 h-10 bg-secondary border-0 rounded-full px-4 focus:ring-2 focus:ring-primary/50'
          />

          {message.trim() || attachments.length > 0 ? (
            <Button
              size='icon'
              onClick={handleSend}
              className='gradient-glow shrink-0 rounded-full'
            >
              <Send className='h-4 w-4' />
            </Button>
          ) : (
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                'text-muted-foreground hover:text-foreground shrink-0',
                isRecording && 'text-destructive',
              )}
              onClick={() => setIsRecording(true)}
            >
              <Mic className='h-5 w-5' />
            </Button>
          )}
        </div>

        {/* Voice Recorder Overlay */}
        <VoiceRecorder
          isRecording={isRecording}
          onStartRecording={() => setIsRecording(true)}
          onStopRecording={handleVoiceRecordingComplete}
          onCancel={() => setIsRecording(false)}
        />
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ''}
        imageName={previewImage?.name || ''}
      />

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCall}
        onClose={() => setShowVideoCall(false)}
        contactName={activeConversation.name}
        contactAvatar={activeConversation.picture}
      />

      {/* Audio Call Modal */}
      <AudioCallModal
        isOpen={showAudioCall}
        onClose={() => setShowAudioCall(false)}
        contactName={activeConversation.name}
        contactAvatar={activeConversation.picture}
      />

      {/* File Preview Screen */}
      <FilePreviewScreen
        isOpen={showFilePreview}
        onClose={() => {
          setShowFilePreview(false);
          setAttachments([]);
        }}
        files={attachments}
        onSend={handleFileSend}
        onAddMore={() => additionalFileInputRef.current?.click()}
        onRemove={removeAttachment}
      />

      {/* Undo Toast */}
      <UndoToast />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
      />
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  sender?: User;
  currentUserId: string;
  onReaction: (emoji: string) => void;
  onImageClick: (file: FileAttachment) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  onDelete: (messageId: string) => void;
  onForward: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  conversation: Conversation;
}

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  sender,
  currentUserId,
  onReaction,
  onImageClick,
  onEdit,
  onDelete,
  onForward,
  onReply,
  onPin,
  onUnpin,
  conversation,
}: MessageBubbleProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get users who have seen this message (for group chats)
  const seenByUsers =
    conversation.isGroup && isOwn && message.seenBy
      ? conversation.users.filter(
          (u) => message.seenBy?.includes(u.id) && u.id !== currentUserId,
        )
      : [];
  const totalOtherUsers = conversation.users.filter(
    (u) => u.id !== currentUserId,
  ).length;

  return (
    <motion.div
      id={`message-${message.id}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-end gap-2 group',
        isOwn ? 'justify-end' : 'justify-start',
        message.isPinned && 'relative',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowReactionPicker(false);
      }}
    >
      {!isOwn && showAvatar && (
        <Avatar className='h-8 w-8'>
          <AvatarImage src={sender?.picture} />
          <AvatarFallback>{sender?.name?.[0]}</AvatarFallback>
        </Avatar>
      )}

      {!isOwn && !showAvatar && <div className='w-8' />}

      <div className='relative min-w-0'>
        {/* Message Actions (Edit/Delete) */}
        <MessageActions
          messageId={message.id}
          messageText={message.message}
          isOwn={isOwn}
          isPinned={message.isPinned}
          onEdit={onEdit}
          onDelete={onDelete}
          onForward={onForward}
          onReply={onReply}
          onPin={onPin}
          onUnpin={onUnpin}
          isVisible={isHovered}
        />

        {/* Reaction button */}
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors z-10',
                isOwn ? '-left-9' : '-right-9',
              )}
            >
              <SmilePlus className='h-4 w-4 text-muted-foreground' />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactionPicker && (
            <ReactionPicker
              onSelect={onReaction}
              onClose={() => setShowReactionPicker(false)}
              position='top'
            />
          )}
        </AnimatePresence>

        {/* Pin indicator */}
        {message.isPinned && (
          <div
            className={cn(
              'absolute -top-1 flex items-center gap-0.5 text-primary',
              isOwn ? 'right-2' : 'left-2',
            )}
          >
            <Pin className='h-3 w-3' />
          </div>
        )}

        <div
          className={cn(
            'relative max-w-[70%] rounded-2xl px-4 py-2 shadow-sm',
            isOwn
              ? 'message-bubble-sent rounded-br-md'
              : 'message-bubble-received rounded-bl-md',
            message.isPinned && 'ring-1 ring-primary/30',
          )}
        >
          {/* Bubble Tail */}
          {showAvatar && (
            <svg
              className={cn(
                'absolute bottom-0 w-3 h-3 z-0',
                isOwn
                  ? '-right-[6px] text-[hsl(var(--chat-sent))]'
                  : '-left-[6px] text-[hsl(var(--chat-received))]',
              )}
              viewBox='0 0 12 12'
              fill='currentColor'
            >
              {isOwn ? (
                <path d='M0 12 L12 12 L12 0 Q6 4 0 0 Z' />
              ) : (
                <path d='M12 12 L0 12 L0 0 Q6 4 12 0 Z' />
              )}
            </svg>
          )}
          {/* Quoted/Reply Message */}
          {message.replyTo && (
            <QuotedMessage
              senderName={message.replyTo.senderName}
              message={message.replyTo.message}
              isOwn={isOwn}
              isOwnReply={message.replyTo.senderId === currentUserId}
            />
          )}

          {/* Files */}
          {message.files && message.files.length > 0 && (
            <div className='mb-2 space-y-2'>
              {message.files.map((file) => {
                const fileInfo = getFileTypeInfo(file.type);
                const FileTypeIcon = fileInfo.icon;
                const category = getFileCategory(file.type);
                const isImage = category === 'IMAGE';
                const isAudio = category === 'AUDIO';
                const isVideo = category === 'VIDEO';

                // Audio message
                if (isAudio) {
                  return (
                    <AudioMessage
                      key={file.id}
                      audioUrl={file.url}
                      isOwn={isOwn}
                    />
                  );
                }

                return (
                  <div
                    key={file.id}
                    onClick={() => isImage && onImageClick(file)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg bg-black/10',
                      isImage &&
                        'cursor-pointer hover:bg-black/20 transition-colors',
                    )}
                  >
                    <FileTypeIcon className={cn('h-5 w-5', fileInfo.color)} />
                    <div className='flex-1 min-w-0'>
                      <span className='text-sm truncate block'>
                        {file.name}
                      </span>
                      <span className='text-[10px] opacity-60'>
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className='text-sm leading-relaxed whitespace-pre-wrap'>
            {message.message}
          </p>

          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isOwn ? 'justify-end' : 'justify-start',
            )}
          >
            {message.isEdited && (
              <span className='text-[10px] opacity-70 flex items-center gap-0.5'>
                <Pencil className='h-2.5 w-2.5' />
                edited
              </span>
            )}
            <span className='text-[10px] opacity-70'>
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
            {isOwn && (
              <span className='opacity-70'>
                {message.read ? (
                  <CheckCheck className='h-3 w-3 text-primary' />
                ) : (
                  <Check className='h-3 w-3' />
                )}
              </span>
            )}
          </div>

          {/* Reactions Display - inside bubble for alignment */}
          {message.reactions && message.reactions.length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              currentUserId={currentUserId}
              onReactionClick={onReaction}
              isOwn={isOwn}
            />
          )}
        </div>

        {/* Read Receipts for Group Chats */}
        {conversation.isGroup && isOwn && seenByUsers.length > 0 && (
          <ReadReceipts
            seenBy={seenByUsers}
            totalUsers={totalOtherUsers}
            isOwn={isOwn}
          />
        )}
      </div>
    </motion.div>
  );
}
