import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  getSocketInstance,
  connectSocket,
  disconnectSocket,
} from '@/lib/socketSimulator';
import { useChatStore } from '@/store/chatStore';
import { useCallStore } from '@/store/callStore';
import { toast } from 'sonner';

interface SocketContextType {
  connected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [connected, setConnected] = useState(false);
  const user = useChatStore((state) => state.user);
  const setTyping = useChatStore((state) => state.setTyping);
  const simulateIncomingCall = useCallStore(
    (state) => state.simulateIncomingCall,
  );

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = connectSocket(user.id);
    setConnected(true);

    // Listen for events
    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    socket.on('typing', (data) => {
      console.log('[Socket] Typing event:', data);
      // Update typing indicator in UI
    });

    socket.on('stop typing', (data) => {
      console.log('[Socket] Stop typing:', data);
    });

    socket.on('receive message', (data) => {
      console.log('[Socket] Received message:', data);
      // Could update messages in store
      toast.info(`New message from conversation`, {
        description:
          data.message?.substring(0, 50) +
          (data.message?.length > 50 ? '...' : ''),
      });
    });

    socket.on('user online', (data) => {
      console.log('[Socket] User online:', data);
    });

    socket.on('user offline', (data) => {
      console.log('[Socket] User offline:', data);
    });

    socket.on('message delivered', (data) => {
      console.log('[Socket] Message delivered:', data);
    });

    socket.on('message seen', (data) => {
      console.log('[Socket] Message seen:', data);
    });

    socket.on('incoming call', (data) => {
      console.log('[Socket] Incoming call:', data);
      simulateIncomingCall(data.caller, data.callType);
    });

    return () => {
      disconnectSocket();
    };
  }, [user, simulateIncomingCall]);

  const value: SocketContextType = {
    connected,
    emit: (event, data) => getSocketInstance().emit(event, data),
    on: (event, callback) => getSocketInstance().on(event, callback),
    off: (event, callback) => getSocketInstance().off(event, callback),
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
