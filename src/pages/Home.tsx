import { useAppSelector } from '@/store';
import { useState } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatArea from '@/components/chat/ChatArea';
import NotificationPermission from '@/components/chat/NotificationPermission';
import IncomingCallModal from '@/components/chat/IncomingCallModal';
import WebRTCManager from '@/components/chat/WebRTCManager';
import AudioCallModal from '@/components/chat/AudioCallModal';
import VideoCallModal from '@/components/chat/VideoCallModal';

import { cn } from '@/lib/utils';

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const activeConversation = useAppSelector((state) => state.chat.activeConversation);

  return (
    <div className='chat-layout'>
      {/* <NotificationPermission /> */}
      <WebRTCManager />
      <IncomingCallModal />
      <AudioCallModal localStream={(window as any).localStream} remoteStream={(window as any).remoteStream} />
      <VideoCallModal localStream={(window as any).localStream} remoteStream={(window as any).remoteStream} />
      <div className={cn('w-full lg:w-auto', showChat && activeConversation ? 'hidden lg:flex' : 'flex')}>      
        <ChatSidebar onConversationSelect={() => setShowChat(true)} />
      </div>
      <div className={cn('flex-1', !showChat || !activeConversation ? 'hidden lg:flex' : 'flex')}>
        <ChatArea onBack={() => setShowChat(false)} />
      </div>
    </div>
  );
}
