import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Send, Paperclip, Smile, Mic, MoreVertical, Phone, Video,
  Search, ArrowLeft, Check, CheckCheck, SmilePlus, Pencil,
  Pin, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useMessages, useSendMessage, useEditMessage, useDeleteMessage, useToggleReaction, usePinMessage, useForwardMessage } from '@/hooks/queries/useMessages';
import { useTyping } from '@/hooks/useTyping';
import { useScrollMessages } from '@/hooks/useScrollMessages';
import { getAcceptedFileTypes, formatFileSize, getFileTypeInfo, getFileCategory } from '@/lib/fileUtils';
import EmojiPicker from './EmojiPicker';
import AttachmentPreview from './AttachmentPreview';
import ReactionPicker from './ReactionPicker';
import { MessageReactions } from './MessageReactions';
import ImagePreviewModal from './ImagePreviewModal';
import VideoCallModal from './VideoCallModal';
import AudioCallModal from './AudioCallModal';
import TypingIndicator from './TypingIndicator';
import MessageActions from './MessageActions';
import UndoToast from './UndoToast';
import ForwardMessageModal from './ForwardMessageModal';
import ReplyPreview from './ReplyPreview';
import { QuotedMessage } from './QuotedMessage';
import PinnedMessagesBar from './PinnedMessagesBar';
import ConversationSearch from './ConversationSearch';
import FilePreviewScreen from './FilePreviewScreen';
import VoiceRecorder from './VoiceRecorder';
import AudioMessage from './AudioMessage';
import ReadReceipts from './ReadReceipts';
import type { Message, FileAttachment, ReplyTo, Conversation, User } from '@/types/index';

interface ChatAreaProps {
  onBack?: () => void;
}

export default function ChatArea({ onBack }: ChatAreaProps) {
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<FileAttachment | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuthStore();
  const { activeConversation, typingUsers } = useChatStore();
  const convId = activeConversation?.id ?? '';

  // ── Queries & Mutations ───────────────────────────────────────────────────

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(convId);

  const messages = data?.messages ?? [];

  const sendMessage = useSendMessage(convId);
  const editMessage = useEditMessage(convId);
  const deleteMessage = useDeleteMessage(convId);
  const toggleReaction = useToggleReaction(convId);
  const pinMessage = usePinMessage(convId);
  const forwardMessage = useForwardMessage(convId);

  // ── Hooks ─────────────────────────────────────────────────────────────────

  const { handleInputChange, stopTyping } = useTyping(convId || undefined);

  const { topSentinelRef, bottomRef } = useScrollMessages({
    messages,
    conversationId: convId || undefined,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  // ── Derived ───────────────────────────────────────────────────────────────

  const otherUser = activeConversation?.users.find((u) => u.id !== user?.id);
  const typingUserIds = convId ? (typingUsers[convId] ?? []) : [];
  const typingUsersList = activeConversation?.users.filter(
    (u) => typingUserIds.includes(u.id) && u.id !== user?.id,
  ) ?? [];
  const isOtherTyping = typingUsersList.length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!messageText.trim() && attachments.length === 0) return;
    stopTyping();
    await sendMessage.mutateAsync({
      payload: { message: messageText.trim(), replyTo: replyingTo ?? undefined },
      files: attachments.length > 0 ? attachments : undefined,
    });
    setMessageText('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setReplyingTo(null);
  }, [messageText, attachments, replyingTo, sendMessage, stopTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    if (files.length > 0) setShowFilePreview(true);
    e.target.value = '';
  };

  const handleFileSend = async (files: File[], caption: string) => {
    await sendMessage.mutateAsync({
      payload: { message: caption, replyTo: replyingTo ?? undefined },
      files,
    });
    setAttachments([]);
    setShowFilePreview(false);
    setReplyingTo(null);
  };

  const handleVoiceComplete = async (blob: Blob | null) => {
    if (blob) {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      await sendMessage.mutateAsync({ payload: { message: '' }, files: [file] });
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
            Select a conversation to start chatting or search for someone to message.
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
          <Button variant='ghost' size='icon' onClick={onBack} className='lg:hidden'>
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
              <motion.p key='typing' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className='text-xs text-primary'>
                {typingUsersList[0]?.name.split(' ')[0]} is typing...
              </motion.p>
            ) : (
              <motion.p key='status' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className='text-xs text-muted-foreground'>
                {activeConversation.isGroup
                  ? `${activeConversation.users.length} members`
                  : otherUser?.status === 'online' ? 'online' : 'offline'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='icon' className='text-muted-foreground' onClick={() => setShowVideoCall(true)}>
            <Video className='h-5 w-5' />
          </Button>
          <Button variant='ghost' size='icon' className='text-muted-foreground' onClick={() => setShowAudioCall(true)}>
            <Phone className='h-5 w-5' />
          </Button>
          <Button
            variant='ghost' size='icon'
            className={cn('text-muted-foreground', showSearch && 'text-primary')}
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className='h-5 w-5' />
          </Button>
        </div>
      </div>

      {/* Conversation Search */}
      <ConversationSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        messages={messages.filter((m) => !m.isDeleted)}
        onNavigateToMessage={(id) => {
          const el = document.getElementById(`message-${id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el?.classList.add('ring-2', 'ring-primary');
          setTimeout(() => el?.classList.remove('ring-2', 'ring-primary'), 2000);
        }}
        currentUserId={user?.id ?? ''}
      />

      {/* Pinned Messages */}
      <PinnedMessagesBar
        conversationId={convId}
        users={activeConversation.users}
        currentUserId={user?.id ?? ''}
        onScrollToMessage={(id) => {
          document.getElementById(`message-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin'>
        {/* Top sentinel for infinite scroll */}
        <div ref={topSentinelRef} className='h-1' />
        {isFetchingNextPage && (
          <div className='flex justify-center py-2'>
            <Loader2 className='h-4 w-4 animate-spin text-primary' />
          </div>
        )}

        {isLoading ? (
          <div className='flex items-center justify-center h-full'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages
              .filter((m) => !m.isDeleted)
              .map((msg, index, arr) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === user?.id}
                  showAvatar={index === 0 || arr[index - 1]?.senderId !== msg.senderId}
                  sender={activeConversation.users.find((u) => u.id === msg.senderId)}
                  currentUserId={user?.id ?? ''}
                  conversation={activeConversation}
                  onReaction={(emoji) => toggleReaction.mutate({ messageId: msg.id, payload: { emoji } })}
                  onImageClick={setPreviewImage}
                  onEdit={(messageId, newMessage) => editMessage.mutate({ messageId, payload: { message: newMessage } })}
                  onDelete={(messageId) => deleteMessage.mutate(messageId)}
                  onForward={(messageId) => setForwardingMessage(messages.find((m) => m.id === messageId) ?? null)}
                  onReply={(messageId) => {
                    const msg = messages.find((m) => m.id === messageId);
                    if (msg) {
                      const senderName = activeConversation.users.find((u) => u.id === msg.senderId)?.name ?? 'Unknown';
                      setReplyingTo({ messageId: msg.id, senderId: msg.senderId, senderName, message: msg.message });
                    }
                  }}
                  onPin={(messageId) => pinMessage.mutate({ messageId, pin: true })}
                  onUnpin={(messageId) => pinMessage.mutate({ messageId, pin: false })}
                />
              ))}
          </AnimatePresence>
        )}

        {isOtherTyping && (
          <TypingIndicator typingUsers={typingUsersList} showAvatars={activeConversation.isGroup} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Attachment Preview */}
      {attachments.length > 0 && !showFilePreview && (
        <AttachmentPreview
          attachments={attachments}
          onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
        />
      )}

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={(emoji) => setMessageText((prev) => prev + emoji)}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <ReplyPreview
            senderName={replyingTo.senderName}
            message={replyingTo.message}
            isOwn={replyingTo.senderId === user?.id}
            onCancel={() => setReplyingTo(null)}
          />
        )}
      </AnimatePresence>

      {/* Input */}
      <div className='p-4 border-t border-border bg-card/50 backdrop-blur-sm'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' className='text-muted-foreground shrink-0'
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Smile className='h-5 w-5' />
          </Button>
          <Button variant='ghost' size='icon' className='text-muted-foreground shrink-0'
            onClick={() => fileInputRef.current?.click()}>
            <Paperclip className='h-5 w-5' />
          </Button>
          <input ref={fileInputRef} type='file' onChange={handleFileSelect}
            accept={getAcceptedFileTypes()} multiple className='hidden' />
          <input ref={additionalFileInputRef} type='file' onChange={handleFileSelect}
            accept={getAcceptedFileTypes()} multiple className='hidden' />

          <Input
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleInputChange();
            }}
            onKeyPress={handleKeyPress}
            placeholder='Type a message...'
            className='flex-1 h-10 bg-secondary border-0 rounded-full px-4 focus:ring-2 focus:ring-primary/50'
          />

          {messageText.trim() || attachments.length > 0 ? (
            <Button size='icon' onClick={handleSend} disabled={sendMessage.isPending}
              className='gradient-glow shrink-0 rounded-full'>
              {sendMessage.isPending
                ? <Loader2 className='h-4 w-4 animate-spin' />
                : <Send className='h-4 w-4' />}
            </Button>
          ) : (
            <Button variant='ghost' size='icon'
              className={cn('text-muted-foreground shrink-0', isRecording && 'text-destructive')}
              onClick={() => setIsRecording(true)}>
              <Mic className='h-5 w-5' />
            </Button>
          )}
        </div>

        <VoiceRecorder
          isRecording={isRecording}
          onStartRecording={() => setIsRecording(true)}
          onStopRecording={handleVoiceComplete}
          onCancel={() => setIsRecording(false)}
        />
      </div>

      <ImagePreviewModal isOpen={!!previewImage} onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url ?? ''} imageName={previewImage?.name ?? ''} />
      <VideoCallModal isOpen={showVideoCall} onClose={() => setShowVideoCall(false)}
        contactName={activeConversation.name} contactAvatar={activeConversation.picture} />
      <AudioCallModal isOpen={showAudioCall} onClose={() => setShowAudioCall(false)}
        contactName={activeConversation.name} contactAvatar={activeConversation.picture} />
      <FilePreviewScreen isOpen={showFilePreview}
        onClose={() => { setShowFilePreview(false); setAttachments([]); }}
        files={attachments} onSend={handleFileSend}
        onAddMore={() => additionalFileInputRef.current?.click()}
        onRemove={(i) => setAttachments((prev) => {
          const next = prev.filter((_, idx) => idx !== i);
          if (next.length === 0) setShowFilePreview(false);
          return next;
        })} />
      <UndoToast conversationId={convId} />
      <ForwardMessageModal isOpen={!!forwardingMessage} onClose={() => setForwardingMessage(null)}
        message={forwardingMessage} />
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────


interface BubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  sender?: User;
  currentUserId: string;
  conversation: Conversation;
  onReaction: (emoji: string) => void;
  onImageClick: (f: FileAttachment) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onForward: (id: string) => void;
  onReply: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}

function MessageBubble({
  message, isOwn, showAvatar, sender, currentUserId, conversation,
  onReaction, onImageClick, onEdit, onDelete, onForward, onReply, onPin, onUnpin,
}: BubbleProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const seenByUsers = conversation.isGroup && isOwn && message.seenBy
    ? conversation.users.filter((u) => message.seenBy!.includes(u.id) && u.id !== currentUserId)
    : [];
  const totalOtherUsers = conversation.users.filter((u) => u.id !== currentUserId).length;

  return (
    <motion.div
      id={`message-${message.id}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-end gap-2 group', isOwn ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowReactionPicker(false); }}
    >
      {!isOwn && showAvatar && (
        <Avatar className='h-8 w-8'>
          <AvatarImage src={sender?.picture} />
          <AvatarFallback>{sender?.name?.[0]}</AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className='w-8' />}

      <div className='relative min-w-0'>
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

        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted z-10',
                isOwn ? '-left-9' : '-right-9',
              )}
            >
              <SmilePlus className='h-4 w-4 text-muted-foreground' />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showReactionPicker && (
            <ReactionPicker
              onSelect={onReaction}
              onClose={() => setShowReactionPicker(false)}
            />
          )}
        </AnimatePresence>

        <div className={cn(
          'relative max-w-[70%] rounded-2xl px-4 py-2 shadow-sm',
          isOwn ? 'message-bubble-sent rounded-br-md' : 'message-bubble-received rounded-bl-md',
          message.isPinned && 'ring-1 ring-primary/30',
        )}>
          {message.replyTo && (
            <QuotedMessage
              senderName={message.replyTo.senderName}
              message={message.replyTo.message}
              isOwn={isOwn}
              isOwnReply={message.replyTo.senderId === currentUserId}
            />
          )}

          {message.files && message.files.length > 0 && (
            <div className='mb-2 space-y-2'>
              {message.files.map((file) => {
                const info = getFileTypeInfo(file.type);
                const Icon = info.icon;
                const cat = getFileCategory(file.type);

                if (cat === 'AUDIO') {
                  return <AudioMessage key={file.id} audioUrl={file.url} isOwn={isOwn} />;
                }
                if (cat === 'IMAGE') {
                  return (
                    <div key={file.id} onClick={() => onImageClick(file)}
                      className='cursor-pointer hover:opacity-90 transition-opacity rounded-lg overflow-hidden'>
                      <img src={file.url} alt={file.name} className='max-w-[200px] max-h-[200px] object-cover' />
                    </div>
                  );
                }
                return (
                  <div key={file.id} className='flex items-center gap-2 p-2 rounded-lg bg-black/10'>
                    <Icon className={cn('h-5 w-5', info.color)} />
                    <div className='flex-1 min-w-0'>
                      <span className='text-sm truncate block'>{file.name}</span>
                      <span className='text-[10px] opacity-60'>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className='text-sm leading-relaxed whitespace-pre-wrap'>{message.message}</p>

          <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
            {message.isEdited && (
              <span className='text-[10px] opacity-70 flex items-center gap-0.5'>
                <Pencil className='h-2.5 w-2.5' /> edited
              </span>
            )}
            <span className='text-[10px] opacity-70'>{format(new Date(message.createdAt), 'HH:mm')}</span>
            {isOwn && (
              <span className='opacity-70'>
                {(message.seenBy?.length ?? 0) > 1
                  ? <CheckCheck className='h-3 w-3 text-primary' />
                  : <Check className='h-3 w-3' />}
              </span>
            )}
          </div>

          {message.reactions && message.reactions.length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              currentUserId={currentUserId}
              onReactionClick={onReaction}
              isOwn={isOwn}
            />
          )}
        </div>

        {conversation.isGroup && isOwn && seenByUsers.length > 0 && (
          <ReadReceipts seenBy={seenByUsers} totalUsers={totalOtherUsers} isOwn={isOwn} />
        )}
      </div>
    </motion.div>
  );
}
