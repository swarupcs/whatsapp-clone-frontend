import { useEffect, useState } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatArea from '@/components/chat/ChatArea';
import NotificationPermission from '@/components/chat/NotificationPermission';
import IncomingCallModal from '@/components/chat/IncomingCallModal';
import { useChatStore } from '@/store/chatStore';
import { useCallStore } from '@/store/callStore';
import { cn } from '@/lib/utils';

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const activeConversation = useChatStore((state) => state.activeConversation);
  const seedConversationsIfNeeded = useChatStore(
    (state) => state.seedConversationsIfNeeded,
  );
  const callStatus = useCallStore((state) => state.callStatus);

  useEffect(() => {
    seedConversationsIfNeeded();
  }, [seedConversationsIfNeeded]);

  return (
    <div className='chat-layout'>
      {/* Notification Permission Handler */}
      <NotificationPermission />

      {/* Incoming Call Modal */}
      <IncomingCallModal />

      {/* Sidebar - hidden on mobile when chat is open */}
      <div
        className={cn(
          'w-full lg:w-auto',
          showChat && activeConversation ? 'hidden lg:flex' : 'flex',
        )}
      >
        <ChatSidebar onConversationSelect={() => setShowChat(true)} />
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          'flex-1',
          !showChat || !activeConversation ? 'hidden lg:flex' : 'flex',
        )}
      >
        <ChatArea onBack={() => setShowChat(false)} />
      </div>
    </div>
  );
}
