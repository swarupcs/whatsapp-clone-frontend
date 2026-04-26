import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Phone,
  Video,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  SmilePlus,
  Pencil,
  Pin,
  Loader2,
  Users,
  X,
  Crown,
  WifiOff,
  AlertCircle,
  RotateCw,
  LogOut,
  UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useCallStore } from '@/store/callStore';
import {
  useMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useToggleReaction,
  usePinMessage,
  useForwardMessage,
} from '@/hooks/queries/useMessages';
import {
  useMarkRead,
  useLeaveGroup,
  useRemoveGroupMember,
} from '@/hooks/queries/useConversations';
import { useTyping } from '@/hooks/useTyping';
import { useScrollMessages } from '@/hooks/useScrollMessages';
import {
  getAcceptedFileTypes,
  formatFileSize,
  getFileTypeInfo,
  getFileCategory,
} from '@/lib/fileUtils';
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
import AddMemberModal from './AddMemberModal';
import ReplyPreview from './ReplyPreview';
import { QuotedMessage } from './QuotedMessage';
import PinnedMessagesBar from './PinnedMessagesBar';
import ConversationSearch from './ConversationSearch';
import FilePreviewScreen from './FilePreviewScreen';
import VoiceRecorder from './VoiceRecorder';
import AudioMessage from './AudioMessage';
import ReadReceipts from './ReadReceipts';
import type {
  Message,
  FileAttachment,
  ReplyTo,
  Conversation,
  User,
} from '@/types';

interface ChatAreaProps {
  onBack?: () => void;
}

// ─── Offline banner ───────────────────────────────────────────────────────────

function OfflineBanner({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className='flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm'
        >
          <WifiOff className='h-4 w-4 shrink-0' />
          <span>
            You're offline. Messages will show as failed until you reconnect.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ChatArea({ onBack }: ChatAreaProps) {
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<FileAttachment | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(
    null,
  );
  const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { activeConversation, typingUsers } = useChatStore();
  const convId = activeConversation?.id ?? '';
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMessages(convId);
  const messages = data?.messages ?? [];
  const sendMessage = useSendMessage(convId);
  const editMessage = useEditMessage(convId);
  const deleteMessage = useDeleteMessage(convId);
  const toggleReaction = useToggleReaction(convId);
  const pinMessage = usePinMessage(convId);
  const forwardMessage = useForwardMessage(convId);
  const markRead = useMarkRead();

  useEffect(() => {
    if (convId) markRead.mutate(convId);
  }, [convId]);

  const { handleInputChange, stopTyping } = useTyping(convId || undefined);
  const { topSentinelRef, bottomRef } = useScrollMessages({
    messages,
    conversationId: convId || undefined,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const otherUser = activeConversation?.users.find((u) => u.id !== user?.id);
  const typingUserIds = convId ? (typingUsers[convId] ?? []) : [];
  const typingUsersList =
    activeConversation?.users.filter(
      (u) => typingUserIds.includes(u.id) && u.id !== user?.id,
    ) ?? [];
  const isOtherTyping = typingUsersList.length > 0;

  const handleSend = useCallback(async () => {
    if (!messageText.trim() && attachments.length === 0) return;
    if (!convId) return;

    stopTyping();

    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await sendMessage.mutateAsync({
      payload: {
        message: messageText.trim(),
        replyTo: replyingTo ?? undefined,
      },
      files: attachments.length > 0 ? attachments : undefined,
      optimisticId,
    });

    setMessageText('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setReplyingTo(null);
  }, [messageText, attachments, replyingTo, sendMessage, stopTyping, convId]);

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
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await sendMessage.mutateAsync({
      payload: {
        message: caption,
        replyTo: replyingTo ?? undefined,
      },
      files,
      optimisticId,
    });
    setAttachments([]);
    setShowFilePreview(false);
    setReplyingTo(null);
  };

  const handleVoiceComplete = async (blob: Blob | null) => {
    if (blob) {
      const file = new File([blob], `voice-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await sendMessage.mutateAsync({
        payload: { message: '' },
        files: [file],
        optimisticId,
      });
    }
    setIsRecording(false);
  };

  const handleRetryMessage = useCallback(
    async (msg: Message) => {
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await sendMessage.mutateAsync({
        payload: { message: msg.message, replyTo: msg.replyTo },
        files: undefined,
        optimisticId,
      });
    },
    [sendMessage],
  );

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
    <div className='flex-1 flex h-full bg-background relative overflow-hidden'>
      <div
        className={cn(
          'flex flex-col flex-1 h-full min-w-0',
          showGroupInfo && 'hidden lg:flex',
        )}
      >
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
          <button
            className='flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left'
            onClick={() => activeConversation.isGroup && setShowGroupInfo(true)}
          >
            <div className='relative shrink-0'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src={activeConversation.picture} />
                <AvatarFallback>{activeConversation.name[0]}</AvatarFallback>
              </Avatar>
              {!activeConversation.isGroup &&
                otherUser?.status === 'online' && (
                  <span className='absolute bottom-0 right-0 h-3 w-3 bg-status-online rounded-full border-2 border-card' />
                )}
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='font-semibold truncate'>
                {activeConversation.name}
              </h3>
              <AnimatePresence mode='wait'>
                {isOtherTyping ? (
                  <motion.p
                    key='typing'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='text-xs text-primary'
                  >
                    {activeConversation.isGroup
                      ? `${typingUsersList.map((u) => u.name.split(' ')[0]).join(', ')} ${typingUsersList.length === 1 ? 'is' : 'are'} typing...`
                      : `${typingUsersList[0]?.name.split(' ')[0]} is typing...`}
                  </motion.p>
                ) : (
                  <motion.p
                    key='status'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
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
          </button>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground'
              onClick={() => {
                if (user && activeConversation) {
                  useCallStore.getState().initiateCall(
                    otherUser ?? activeConversation.users[0],
                    'video'
                  );
                  useCallStore.getState().setCallState({ conversationId: activeConversation.id });
                }
              }}
            >
              <Video className='h-5 w-5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground'
              onClick={() => {
                if (user && activeConversation) {
                  useCallStore.getState().initiateCall(
                    otherUser ?? activeConversation.users[0],
                    'audio'
                  );
                  useCallStore.getState().setCallState({ conversationId: activeConversation.id });
                }
              }}
            >
              <Phone className='h-5 w-5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                'text-muted-foreground',
                showSearch && 'text-primary',
              )}
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className='h-5 w-5' />
            </Button>
            {activeConversation.isGroup && (
              <Button
                variant='ghost'
                size='icon'
                className={cn(
                  'text-muted-foreground',
                  showGroupInfo && 'text-primary',
                )}
                onClick={() => setShowGroupInfo(!showGroupInfo)}
              >
                <Users className='h-5 w-5' />
              </Button>
            )}
          </div>
        </div>

        <OfflineBanner visible={isOffline} />

        <ConversationSearch
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          messages={messages.filter((m) => !m.isDeleted)}
          onNavigateToMessage={(id) => {
            const el = document.getElementById(`message-${id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el?.classList.add('ring-2', 'ring-primary');
            setTimeout(
              () => el?.classList.remove('ring-2', 'ring-primary'),
              2000,
            );
          }}
          currentUserId={user?.id ?? ''}
        />

        <PinnedMessagesBar
          conversationId={convId}
          users={activeConversation.users}
          currentUserId={user?.id ?? ''}
          onScrollToMessage={(id) => {
            document
              .getElementById(`message-${id}`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />

        <div className='flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin'>
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
                .map((msg, index, arr) => {
                  const prevMsg = arr[index - 1];
                  const showAvatar =
                    !prevMsg || prevMsg.senderId !== msg.senderId;
                  const showSenderName =
                    activeConversation.isGroup &&
                    msg.senderId !== user?.id &&
                    showAvatar;
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === user?.id}
                      showAvatar={showAvatar}
                      showSenderName={showSenderName}
                      sender={activeConversation.users.find(
                        (u) => u.id === msg.senderId,
                      )}
                      currentUserId={user?.id ?? ''}
                      conversation={activeConversation}
                      onReaction={(emoji) =>
                        toggleReaction.mutate({
                          messageId: msg.id,
                          payload: { emoji },
                        })
                      }
                      onImageClick={setPreviewImage}
                      onEdit={(messageId, newMessage) => {
                        if (messageId.startsWith('optimistic-')) return;
                        editMessage.mutate({
                          messageId,
                          payload: { message: newMessage },
                        });
                      }}
                      onDelete={(messageId) => deleteMessage.mutate(messageId)}
                      onForward={(messageId) =>
                        setForwardingMessage(
                          messages.find((m) => m.id === messageId) ?? null,
                        )
                      }
                      onReply={(messageId) => {
                        const m = messages.find((m) => m.id === messageId);
                        if (m) {
                          const senderName =
                            activeConversation.users.find(
                              (u) => u.id === m.senderId,
                            )?.name ?? 'Unknown';
                          setReplyingTo({
                            messageId: m.id,
                            senderId: m.senderId,
                            senderName,
                            message: m.message,
                          });
                        }
                      }}
                      onPin={(messageId) =>
                        pinMessage.mutate({ messageId, pin: true })
                      }
                      onUnpin={(messageId) =>
                        pinMessage.mutate({ messageId, pin: false })
                      }
                      onRetry={handleRetryMessage}
                    />
                  );
                })}
            </AnimatePresence>
          )}
          {isOtherTyping && (
            <TypingIndicator
              typingUsers={typingUsersList}
              showAvatars={activeConversation.isGroup}
            />
          )}
          <div ref={bottomRef} />
        </div>

        {attachments.length > 0 && !showFilePreview && (
          <AttachmentPreview
            attachments={attachments}
            onRemove={(i) =>
              setAttachments((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
        )}
        <AnimatePresence>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => setMessageText((prev) => prev + emoji)}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </AnimatePresence>
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

        <div className='p-4 border-t border-border bg-card/50 backdrop-blur-sm'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground shrink-0'
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className='h-5 w-5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground shrink-0'
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className='h-5 w-5' />
            </Button>
            <input
              ref={fileInputRef}
              type='file'
              onChange={handleFileSelect}
              accept={getAcceptedFileTypes()}
              multiple
              className='hidden'
            />
            <input
              ref={additionalFileInputRef}
              type='file'
              onChange={handleFileSelect}
              accept={getAcceptedFileTypes()}
              multiple
              className='hidden'
            />
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
              <Button
                size='icon'
                onClick={handleSend}
                disabled={sendMessage.isPending}
                className='gradient-glow shrink-0 rounded-full'
              >
                {sendMessage.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Send className='h-4 w-4' />
                )}
              </Button>
            ) : (
              <Button
                variant='ghost'
                size='icon'
                className={cn(
                  'text-muted-foreground shrink-0',
                  isRecording && 'text-destructive',
                )}
                onClick={() => setIsRecording(true)}
              >
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
      </div>

      <AnimatePresence>
        {showGroupInfo && activeConversation.isGroup && (
          <GroupInfoPanel
            conversation={activeConversation}
            currentUserId={user?.id ?? ''}
            onClose={() => setShowGroupInfo(false)}
          />
        )}
      </AnimatePresence>

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url ?? ''}
        imageName={previewImage?.name ?? ''}
      />
      <FilePreviewScreen
        isOpen={showFilePreview}
        onClose={() => {
          setShowFilePreview(false);
          setAttachments([]);
        }}
        files={attachments}
        onSend={handleFileSend}
        onAddMore={() => additionalFileInputRef.current?.click()}
        onRemove={(i) =>
          setAttachments((prev) => {
            const next = prev.filter((_, idx) => idx !== i);
            if (next.length === 0) setShowFilePreview(false);
            return next;
          })
        }
      />
      <UndoToast conversationId={convId} />
      <ForwardMessageModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
      />
    </div>
  );
}

// ─── Group info panel ─────────────────────────────────────────────────────────

function GroupInfoPanel({
  conversation,
  currentUserId,
  onClose,
}: {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
}) {
  const leaveGroup = useLeaveGroup();
  const removeMember = useRemoveGroupMember(conversation.id);
  const isAdmin = conversation.adminId === currentUserId;
  const [showAddMember, setShowAddMember] = useState(false);

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    await leaveGroup.mutateAsync(conversation.id);
    onClose();
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!window.confirm(`Remove ${userName} from the group?`)) return;
    await removeMember.mutateAsync(userId);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className='w-80 h-full border-l border-border bg-card flex flex-col shrink-0'
    >
      <div className='h-16 px-4 flex items-center justify-between border-b border-border'>
        <h3 className='font-semibold'>Group info</h3>
        <Button variant='ghost' size='icon' onClick={onClose}>
          <X className='h-5 w-5' />
        </Button>
      </div>

      <div className='flex-1 overflow-y-auto scrollbar-thin'>
        {/* Group avatar + name */}
        <div className='flex flex-col items-center py-6 px-4 border-b border-border'>
          <Avatar className='h-20 w-20 mb-3'>
            <AvatarImage src={conversation.picture} />
            <AvatarFallback className='text-2xl'>
              {conversation.name[0]}
            </AvatarFallback>
          </Avatar>
          <h4 className='font-semibold text-lg text-center'>
            {conversation.name}
          </h4>
          <p className='text-sm text-muted-foreground mt-1'>
            Group · {conversation.users.length} members
          </p>
        </div>

        {/* Members list */}
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between mb-3'>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              {conversation.users.length} members
            </p>
            {isAdmin && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10'
                onClick={() => setShowAddMember(true)}
              >
                + Add
              </Button>
            )}
          </div>
          <div className='space-y-1'>
            {conversation.users.map((member) => {
              const isMemberAdmin = member.id === conversation.adminId;
              const isMe = member.id === currentUserId;
              return (
                <div
                  key={member.id}
                  className='flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group'
                >
                  <div className='relative shrink-0'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={member.picture} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    {member.status === 'online' && (
                      <span className='absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1.5'>
                      <span className='text-sm font-medium truncate'>
                        {isMe ? 'You' : member.name}
                      </span>
                      {isMemberAdmin && (
                        <Crown className='h-3.5 w-3.5 text-amber-500 shrink-0' />
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground truncate capitalize'>
                      {isMemberAdmin ? 'Admin' : member.status}
                    </p>
                  </div>
                  {/* Admin can remove others (not themselves) */}
                  {isAdmin && !isMe && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10'
                      disabled={removeMember.isPending}
                      onClick={() => handleRemoveMember(member.id, member.name)}
                    >
                      <UserMinus className='h-3.5 w-3.5' />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leave group button */}
      <div className='p-4 border-t border-border'>
        <Button
          variant='outline'
          className='w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2'
          disabled={leaveGroup.isPending}
          onClick={handleLeave}
        >
          {leaveGroup.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <LogOut className='h-4 w-4' />
          )}
          Leave group
        </Button>
      </div>

      {isAdmin && (
        <AddMemberModal
          open={showAddMember}
          onOpenChange={setShowAddMember}
          conversation={conversation}
        />
      )}
    </motion.div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

interface BubbleProps {
  message: Message & {
    _failed?: boolean;
    _failedReason?: string;
    _pending?: boolean;
  };
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
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
  onRetry: (msg: Message) => void;
}

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showSenderName,
  sender,
  currentUserId,
  conversation,
  onReaction,
  onImageClick,
  onEdit,
  onDelete,
  onForward,
  onReply,
  onPin,
  onUnpin,
  onRetry,
}: BubbleProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const msg = message as Message & {
    _failed?: boolean;
    _failedReason?: string;
    _pending?: boolean;
  };
  const isPending = msg._pending || msg.id.startsWith('optimistic-');
  const isFailed = msg._failed;

  const seenByUsers =
    conversation.isGroup && isOwn && message.seenBy
      ? conversation.users.filter(
          (u) => message.seenBy!.includes(u.id) && u.id !== currentUserId,
        )
      : [];
  const totalOtherUsers = conversation.users.filter(
    (u) => u.id !== currentUserId,
  ).length;

  // Keep action elements visible if reaction picker is open,
  // same pattern as MessageActions — prevents onMouseLeave from
  // destroying the picker before the user can click a reaction.
  const shouldShowActions = isHovered || showReactionPicker;

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
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Do NOT close showReactionPicker here — let the picker
        // close itself via its own onClose callback
      }}
    >
      {!isOwn && showAvatar && (
        <Avatar className='h-8 w-8 self-end mb-1'>
          <AvatarImage src={sender?.picture} />
          <AvatarFallback>{sender?.name?.[0]}</AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className='w-8' />}

      <div className='relative min-w-0 max-w-[70%]'>
        {!isPending && !isFailed && (
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
        )}

        <AnimatePresence>
          {shouldShowActions && !isPending && !isFailed && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setShowReactionPicker((prev) => !prev)}
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
              onSelect={(emoji) => {
                onReaction(emoji);
                setShowReactionPicker(false);
              }}
              onClose={() => setShowReactionPicker(false)}
            />
          )}
        </AnimatePresence>

        {showSenderName && sender && (
          <p className='text-xs font-medium text-primary/80 mb-1 ml-1 truncate'>
            {sender.name}
          </p>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-2 shadow-sm',
            isOwn
              ? 'message-bubble-sent rounded-br-md'
              : 'message-bubble-received rounded-bl-md',
            message.isPinned && 'ring-1 ring-primary/30',
            isPending && 'opacity-60',
            isFailed && 'ring-1 ring-destructive/50 opacity-80',
          )}
        >
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
                if (cat === 'AUDIO')
                  return (
                    <AudioMessage
                      key={file.id}
                      audioUrl={file.url}
                      isOwn={isOwn}
                    />
                  );
                if (cat === 'IMAGE')
                  return (
                    <div
                      key={file.id}
                      onClick={() => onImageClick(file)}
                      className='cursor-pointer hover:opacity-90 transition-opacity rounded-lg overflow-hidden'
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className='max-w-[200px] max-h-[200px] object-cover'
                      />
                    </div>
                  );
                return (
                  <a
                    key={file.id}
                    href={file.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors'
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', info.color)} />
                    <div className='flex-1 min-w-0'>
                      <span className='text-sm truncate block'>
                        {file.name}
                      </span>
                      <span className='text-[10px] opacity-60'>
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {message.message && (
            <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
              {message.message}
            </p>
          )}

          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isOwn ? 'justify-end' : 'justify-start',
            )}
          >
            {message.isEdited && (
              <span className='text-[10px] opacity-70 flex items-center gap-0.5'>
                <Pencil className='h-2.5 w-2.5' /> edited
              </span>
            )}
            <span className='text-[10px] opacity-70'>
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
            {isOwn && (
              <span className='opacity-70'>
                {isFailed ? (
                  <AlertCircle className='h-3 w-3 text-destructive' />
                ) : isPending ? (
                  <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />
                ) : (message.seenBy?.length ?? 0) > 1 ? (
                  <CheckCheck className='h-3 w-3 text-primary' />
                ) : (
                  <Check className='h-3 w-3' />
                )}
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

        {isFailed && isOwn && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onRetry(message)}
            className='flex items-center gap-1 mt-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors ml-auto'
          >
            <RotateCw className='h-3 w-3' />
            Tap to retry
          </motion.button>
        )}

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
