import type { User } from "@/types";


type EventCallback = (data: any) => void;

interface SimulatedSocket {
  connected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: EventCallback) => void;
  off: (event: string, callback?: EventCallback) => void;
  disconnect: () => void;
  connect: () => void;
}

// Mock users for simulation
const mockUsers: User[] = [
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    status: 'online',
    about: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    status: 'online',
    about: 'Busy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Alex Brown',
    email: 'alex@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    status: 'online',
    about: 'Hello!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const randomMessages = [
  'Hey, how are you?',
  'Did you see my last message?',
  'That sounds great!',
  "Let me know when you're free",
  'Thanks for the update 👍',
  "I'll check and get back to you",
  'Sounds good to me!',
  'Can we discuss this later?',
  'Perfect! 🎉',
  'Got it, thanks!',
];

class SocketSimulator implements SimulatedSocket {
  connected = false;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private intervals: ReturnType<typeof setInterval>[] = [];
  private currentUserId: string = '';

  connect() {
    this.connected = true;
    this.emit('connect');
    this.startSimulations();
  }

  disconnect() {
    this.connected = false;
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.emit('disconnect');
  }

  emit(event: string, data?: any) {
    // Handle outgoing events
    switch (event) {
      case 'join':
        this.currentUserId = data?.id;
        console.log('[Socket Simulator] User joined:', data?.id);
        break;
      case 'send message':
        // Simulate message delivery confirmation
        setTimeout(() => {
          this.trigger('message sent', { ...data, status: 'sent' });
          setTimeout(
            () => {
              this.trigger('message delivered', { messageId: data.id });
            },
            1000 + Math.random() * 1000,
          );
        }, 200);
        break;
      case 'typing':
        // Could trigger UI updates
        break;
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback?: EventCallback) {
    if (callback) {
      this.eventListeners.get(event)?.delete(callback);
    } else {
      this.eventListeners.delete(event);
    }
  }

  private trigger(event: string, data?: any) {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }

  private startSimulations() {
    // Simulate typing indicators randomly
    const typingInterval = setInterval(
      () => {
        if (!this.connected || Math.random() > 0.3) return;

        const randomUser =
          mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const conversationId = `conv-${Math.floor(Math.random() * 4) + 1}`;

        this.trigger('typing', {
          conversationId,
          userId: randomUser.id,
          userName: randomUser.name,
        });

        // Stop typing after 2-4 seconds
        setTimeout(
          () => {
            this.trigger('stop typing', {
              conversationId,
              userId: randomUser.id,
            });
          },
          2000 + Math.random() * 2000,
        );
      },
      8000 + Math.random() * 12000,
    );

    this.intervals.push(typingInterval);

    // Simulate online/offline status changes
    const statusInterval = setInterval(
      () => {
        if (!this.connected || Math.random() > 0.2) return;

        const randomUser =
          mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const isOnline = Math.random() > 0.3;

        this.trigger(isOnline ? 'user online' : 'user offline', {
          id: randomUser.id,
        });
      },
      15000 + Math.random() * 15000,
    );

    this.intervals.push(statusInterval);

    // Simulate incoming messages occasionally
    const messageInterval = setInterval(
      () => {
        if (!this.connected || Math.random() > 0.15) return;

        const randomUser =
          mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const conversationId = `conv-${Math.floor(Math.random() * 4) + 1}`;
        const message =
          randomMessages[Math.floor(Math.random() * randomMessages.length)];

        this.trigger('receive message', {
          id: `simulated-${Date.now()}`,
          conversationId,
          senderId: randomUser.id,
          message,
          createdAt: new Date(),
          read: false,
        });
      },
      20000 + Math.random() * 40000,
    );

    this.intervals.push(messageInterval);

    // Simulate message seen status updates
    const seenInterval = setInterval(
      () => {
        if (!this.connected || Math.random() > 0.4) return;

        this.trigger('message seen', {
          messageId: `msg-${Math.floor(Math.random() * 10)}`,
          seenBy: mockUsers[Math.floor(Math.random() * mockUsers.length)].id,
        });
      },
      10000 + Math.random() * 20000,
    );

    this.intervals.push(seenInterval);
  }

  // Method to manually trigger an incoming call (for demo purposes)
  simulateIncomingCall(type: 'video' | 'audio' = 'video') {
    if (!this.connected) return;

    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    this.trigger('incoming call', {
      caller: randomUser,
      callType: type,
    });
  }
}

// Singleton instance
let socketInstance: SocketSimulator | null = null;

export function getSocketInstance(): SimulatedSocket {
  if (!socketInstance) {
    socketInstance = new SocketSimulator();
  }
  return socketInstance;
}

export function connectSocket(userId: string) {
  const socket = getSocketInstance();
  socket.connect();
  socket.emit('join', { id: userId });
  return socket;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}
