import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationService } from '@/lib/notifications';

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  status: 'online' | 'offline' | 'away';
  about?: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  files?: FileAttachment[];
  reactions?: Reaction[];
  createdAt: Date;
  read: boolean;
  seenBy?: string[]; // Array of user IDs who have seen this message
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  originalMessage?: string; // For undo functionality
  isPinned?: boolean;
  pinnedAt?: Date;
  pinnedBy?: string;
  replyTo?: {
    messageId: string;
    senderId: string;
    senderName: string;
    message: string;
  };
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface Conversation {
  id: string;
  name: string;
  picture: string;
  isGroup: boolean;
  users: User[];
  admin?: string;
  latestMessage?: Message;
  unreadCount: number;
  typing?: string[];
  createdAt: Date;
}

interface ChatState {
  user: User | null;
  token: string | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  onlineUsers: string[];
  typingUsers: { [conversationId: string]: string[] };
  searchResults: User[];
  isLoading: boolean;
  deletedMessages: { message: Message; timeout: NodeJS.Timeout }[];
  editedMessages: {
    messageId: string;
    originalMessage: string;
    timeout: NodeJS.Timeout;
  }[];
  seedConversationsIfNeeded: () => void;

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Chat actions
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (
    message: string,
    files?: File[],
    replyTo?: {
      messageId: string;
      senderId: string;
      senderName: string;
      message: string;
    },
  ) => void;
  searchUsers: (query: string) => void;
  createConversation: (userId: string) => void;
  createGroup: (name: string, userIds: string[]) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  markAsRead: (conversationId: string) => void;
  updateUserStatus: (status: 'online' | 'offline' | 'away') => void;
  updateProfile: (
    updates: Partial<Pick<User, 'name' | 'about' | 'picture'>>,
  ) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, newMessage: string) => void;
  deleteMessage: (messageId: string) => void;
  undoDeleteMessage: (messageId: string) => void;
  undoEditMessage: (messageId: string) => void;
  forwardMessage: (messageId: string, toConversationId: string) => void;
  pinMessage: (messageId: string) => void;
  unpinMessage: (messageId: string) => void;
}

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    status: 'online',
    about: 'Hey there! I am using WhatsUp',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    status: 'online',
    about: 'Available',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    status: 'away',
    about: 'Busy',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    status: 'offline',
    about: 'At work',
  },
  {
    id: '5',
    name: 'Alex Brown',
    email: 'alex@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    status: 'online',
    about: 'Hello!',
  },
  {
    id: '6',
    name: 'Emily Davis',
    email: 'emily@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    status: 'online',
    about: 'Living life',
  },
  {
    id: '7',
    name: 'Chris Lee',
    email: 'chris@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris',
    status: 'offline',
    about: 'Away',
  },
  {
    id: '8',
    name: 'David Miller',
    email: 'david@example.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    status: 'online',
    about: 'Happy to connect!',
  },
];

// Mock conversations with groups
const createMockConversations = (
  currentUserId: string,
  currentUser: User,
): Conversation[] => {
  const otherUsers = mockUsers.filter((u) => u.id !== currentUserId);

  // Direct message conversations
  const directConversations = otherUsers.slice(0, 4).map((user, index) => ({
    id: `conv-${index + 1}`,
    name: user.name,
    picture: user.picture,
    isGroup: false,
    users: [currentUser, user],
    unreadCount: Math.floor(Math.random() * 5),
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 7),
    latestMessage: {
      id: `msg-latest-${index}`,
      conversationId: `conv-${index + 1}`,
      senderId: Math.random() > 0.5 ? currentUserId : user.id,
      message: [
        'Hey, how are you?',
        'Did you see the meeting notes?',
        'Sounds good!',
        'Let me check...',
      ][index],
      createdAt: new Date(Date.now() - Math.random() * 3600000),
      read: Math.random() > 0.5,
    },
  }));

  // Group conversations
  const groupConversations: Conversation[] = [
    {
      id: 'group-1',
      name: '🚀 Project Alpha Team',
      picture: 'https://api.dicebear.com/7.x/shapes/svg?seed=project-alpha',
      isGroup: true,
      users: [currentUser, otherUsers[0], otherUsers[1], otherUsers[2]],
      admin: currentUserId,
      unreadCount: 3,
      createdAt: new Date(Date.now() - 86400000 * 14),
      latestMessage: {
        id: 'msg-group1-latest',
        conversationId: 'group-1',
        senderId: otherUsers[1].id,
        message: 'Great progress on the sprint! 🎉',
        createdAt: new Date(Date.now() - 1800000),
        read: false,
      },
    },
    {
      id: 'group-2',
      name: '🎮 Gaming Squad',
      picture: 'https://api.dicebear.com/7.x/shapes/svg?seed=gaming-squad',
      isGroup: true,
      users: [
        currentUser,
        otherUsers[3],
        otherUsers[4],
        otherUsers[5],
        otherUsers[6],
      ],
      admin: otherUsers[3].id,
      unreadCount: 8,
      createdAt: new Date(Date.now() - 86400000 * 30),
      latestMessage: {
        id: 'msg-group2-latest',
        conversationId: 'group-2',
        senderId: otherUsers[4].id,
        message: 'Anyone up for ranked tonight? 🎮',
        createdAt: new Date(Date.now() - 600000),
        read: false,
      },
    },
    {
      id: 'group-3',
      name: '💼 Work Buddies',
      picture: 'https://api.dicebear.com/7.x/shapes/svg?seed=work-buddies',
      isGroup: true,
      users: [currentUser, otherUsers[0], otherUsers[2], otherUsers[5]],
      admin: otherUsers[0].id,
      unreadCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 60),
      latestMessage: {
        id: 'msg-group3-latest',
        conversationId: 'group-3',
        senderId: currentUserId,
        message: 'Lunch at 12:30? 🍕',
        createdAt: new Date(Date.now() - 7200000),
        read: true,
      },
    },
    {
      id: 'group-4',
      name: '📚 Book Club',
      picture: 'https://api.dicebear.com/7.x/shapes/svg?seed=book-club',
      isGroup: true,
      users: [currentUser, otherUsers[1], otherUsers[4], otherUsers[6]],
      admin: otherUsers[1].id,
      unreadCount: 2,
      createdAt: new Date(Date.now() - 86400000 * 45),
      latestMessage: {
        id: 'msg-group4-latest',
        conversationId: 'group-4',
        senderId: otherUsers[6].id,
        message: 'Just finished chapter 5, mind-blowing twist! 🤯',
        createdAt: new Date(Date.now() - 3600000),
        read: false,
      },
    },
  ];

  return [...directConversations, ...groupConversations];
};

// Mock messages with rich content for direct messages
const createDirectMessages = (
  conversationId: string,
  currentUserId: string,
  otherUserId: string,
): Message[] => {
  return [
    {
      id: `${conversationId}-msg-0`,
      conversationId,
      senderId: otherUserId,
      message: "Hey! How's it going? 👋",
      createdAt: new Date(Date.now() - 3600000 * 2),
      read: true,
      reactions: [{ emoji: '👋', userId: currentUserId }],
    },
    {
      id: `${conversationId}-msg-1`,
      conversationId,
      senderId: currentUserId,
      message:
        "Hey! I'm doing great, thanks for asking! Just finished working on that new project we discussed.",
      createdAt: new Date(Date.now() - 3600000 * 1.9),
      read: true,
      reactions: [
        { emoji: '👍', userId: otherUserId },
        { emoji: '🔥', userId: otherUserId },
      ],
    },
    {
      id: `${conversationId}-msg-2`,
      conversationId,
      senderId: otherUserId,
      message:
        "That's awesome! Can't wait to see what you've built. Is it the chat app you were telling me about?",
      createdAt: new Date(Date.now() - 3600000 * 1.8),
      read: true,
    },
    {
      id: `${conversationId}-msg-3`,
      conversationId,
      senderId: currentUserId,
      message:
        'Yes! It has real-time messaging, emoji reactions, file sharing, and group chats. Pretty proud of how it turned out! 🚀',
      createdAt: new Date(Date.now() - 3600000 * 1.7),
      read: true,
      reactions: [
        { emoji: '🚀', userId: otherUserId },
        { emoji: '❤️', userId: otherUserId },
        { emoji: '🎉', userId: currentUserId },
      ],
    },
    {
      id: `${conversationId}-msg-4`,
      conversationId,
      senderId: otherUserId,
      message:
        'That sounds incredible! The emoji reactions feature is so useful.',
      createdAt: new Date(Date.now() - 3600000 * 1.5),
      read: true,
      reactions: [{ emoji: '💯', userId: currentUserId }],
    },
    {
      id: `${conversationId}-msg-5`,
      conversationId,
      senderId: currentUserId,
      message:
        "Exactly what I was going for! Here's a sneak peek of the design docs:",
      createdAt: new Date(Date.now() - 3600000 * 1.3),
      read: true,
      files: [
        {
          id: 'file-1',
          name: 'design-specs.pdf',
          type: 'application/pdf',
          url: '#',
          size: 2500000,
        },
        {
          id: 'file-2',
          name: 'mockups.png',
          type: 'image/png',
          url: '#',
          size: 1200000,
        },
      ],
    },
    {
      id: `${conversationId}-msg-6`,
      conversationId,
      senderId: otherUserId,
      message: 'These look amazing! The dark theme is really sleek 🌙',
      createdAt: new Date(Date.now() - 3600000),
      read: true,
      reactions: [{ emoji: '😍', userId: currentUserId }],
    },
    {
      id: `${conversationId}-msg-7`,
      conversationId,
      senderId: currentUserId,
      message:
        'Thanks! Built it with Tailwind CSS. Used glass morphism effects for that modern look ✨',
      createdAt: new Date(Date.now() - 2700000),
      read: true,
    },
    {
      id: `${conversationId}-msg-8`,
      conversationId,
      senderId: otherUserId,
      message: 'Are you planning to add voice messages too?',
      createdAt: new Date(Date.now() - 1800000),
      read: true,
    },
    {
      id: `${conversationId}-msg-9`,
      conversationId,
      senderId: currentUserId,
      message:
        "That's on the roadmap! Along with video calls. Want to test it when it's ready?",
      createdAt: new Date(Date.now() - 900000),
      read: true,
      reactions: [
        { emoji: '🙌', userId: otherUserId },
        { emoji: '👍', userId: otherUserId },
      ],
    },
    {
      id: `${conversationId}-msg-10`,
      conversationId,
      senderId: otherUserId,
      message: 'Absolutely! Count me in. This is going to be great! 🎉',
      createdAt: new Date(Date.now() - 300000),
      read: true,
      reactions: [
        { emoji: '❤️', userId: currentUserId },
        { emoji: '🎉', userId: currentUserId },
      ],
    },
  ];
};

// Mock messages for group conversations
const createGroupMessages = (
  conversationId: string,
  currentUserId: string,
  otherUsers: User[],
): Message[] => {
  const groupMessageSets: Record<string, Message[]> = {
    'group-1': [
      {
        id: 'group1-msg-0',
        conversationId: 'group-1',
        senderId: otherUsers[0]?.id || '',
        message: 'Hey team! Quick standup reminder for tomorrow at 9 AM 📅',
        createdAt: new Date(Date.now() - 86400000),
        read: true,
        reactions: [
          { emoji: '👍', userId: currentUserId },
          { emoji: '✅', userId: otherUsers[1]?.id || '' },
        ],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group1-msg-1',
        conversationId: 'group-1',
        senderId: currentUserId,
        message: "Got it! I'll have the sprint review ready by then.",
        createdAt: new Date(Date.now() - 82800000),
        read: true,
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group1-msg-2',
        conversationId: 'group-1',
        senderId: otherUsers[1]?.id || '',
        message: 'Perfect! Also, here are the updated wireframes we discussed:',
        createdAt: new Date(Date.now() - 79200000),
        read: true,
        files: [
          {
            id: 'grp1-file-1',
            name: 'wireframes-v2.fig',
            type: 'application/octet-stream',
            url: '#',
            size: 3400000,
          },
        ],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group1-msg-3',
        conversationId: 'group-1',
        senderId: otherUsers[2]?.id || '',
        message: 'These look clean! Love the new navigation flow 🎨',
        createdAt: new Date(Date.now() - 72000000),
        read: true,
        reactions: [
          { emoji: '🎨', userId: currentUserId },
          { emoji: '❤️', userId: otherUsers[0]?.id || '' },
        ],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group1-msg-4',
        conversationId: 'group-1',
        senderId: currentUserId,
        message:
          'Agreed! @Jane great work on the user research that informed this.',
        createdAt: new Date(Date.now() - 43200000),
        read: true,
        replyTo: {
          messageId: 'group1-msg-3',
          senderId: otherUsers[2]?.id || '',
          senderName: otherUsers[2]?.name || '',
          message: 'These look clean! Love the new navigation flow 🎨',
        },
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group1-msg-5',
        conversationId: 'group-1',
        senderId: otherUsers[0]?.id || '',
        message: 'The client meeting is in 2 hours. Everyone ready? 💼',
        createdAt: new Date(Date.now() - 7200000),
        read: true,
        seenBy: otherUsers.slice(0, 2).map((u) => u.id),
      },
      {
        id: 'group1-msg-6',
        conversationId: 'group-1',
        senderId: currentUserId,
        message: 'Ready! Just finishing up the demo environment.',
        createdAt: new Date(Date.now() - 5400000),
        read: true,
        reactions: [{ emoji: '🚀', userId: otherUsers[0]?.id || '' }],
        seenBy: otherUsers.slice(0, 1).map((u) => u.id),
      },
      {
        id: 'group1-msg-7',
        conversationId: 'group-1',
        senderId: otherUsers[1]?.id || '',
        message: 'Great progress on the sprint! 🎉',
        createdAt: new Date(Date.now() - 1800000),
        read: false,
        reactions: [{ emoji: '🎉', userId: otherUsers[2]?.id || '' }],
        seenBy: [],
      },
    ],
    'group-2': [
      {
        id: 'group2-msg-0',
        conversationId: 'group-2',
        senderId: otherUsers[0]?.id || '',
        message: "Who's online for some games tonight? 🎮",
        createdAt: new Date(Date.now() - 28800000),
        read: true,
        reactions: [
          { emoji: '🙋', userId: currentUserId },
          { emoji: '🙋', userId: otherUsers[1]?.id || '' },
        ],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group2-msg-1',
        conversationId: 'group-2',
        senderId: currentUserId,
        message: "I'm in! What are we playing?",
        createdAt: new Date(Date.now() - 25200000),
        read: true,
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group2-msg-2',
        conversationId: 'group-2',
        senderId: otherUsers[1]?.id || '',
        message: 'How about some Valorant? New season just dropped 🔥',
        createdAt: new Date(Date.now() - 21600000),
        read: true,
        reactions: [
          { emoji: '🔥', userId: currentUserId },
          { emoji: '👍', userId: otherUsers[2]?.id || '' },
        ],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group2-msg-3',
        conversationId: 'group-2',
        senderId: otherUsers[2]?.id || '',
        message: "I'm down! Need to grind that battle pass anyway lol",
        createdAt: new Date(Date.now() - 18000000),
        read: true,
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group2-msg-4',
        conversationId: 'group-2',
        senderId: otherUsers[3]?.id || '',
        message: 'Count me in too! Been practicing my aim 🎯',
        createdAt: new Date(Date.now() - 14400000),
        read: true,
        reactions: [{ emoji: '💪', userId: currentUserId }],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group2-msg-5',
        conversationId: 'group-2',
        senderId: currentUserId,
        message:
          "Nice! Let's do 8 PM? That gives everyone time to grab dinner.",
        createdAt: new Date(Date.now() - 10800000),
        read: true,
        reactions: [
          { emoji: '👍', userId: otherUsers[0]?.id || '' },
          { emoji: '👍', userId: otherUsers[1]?.id || '' },
        ],
        seenBy: otherUsers.slice(0, 3).map((u) => u.id),
      },
      {
        id: 'group2-msg-6',
        conversationId: 'group-2',
        senderId: otherUsers[0]?.id || '',
        message: "Perfect timing! I'll set up the Discord call.",
        createdAt: new Date(Date.now() - 7200000),
        read: true,
        seenBy: otherUsers.slice(0, 2).map((u) => u.id),
      },
      {
        id: 'group2-msg-7',
        conversationId: 'group-2',
        senderId: otherUsers[1]?.id || '',
        message: 'Just hit Platinum rank btw 💎',
        createdAt: new Date(Date.now() - 3600000),
        read: true,
        reactions: [
          { emoji: '🎉', userId: currentUserId },
          { emoji: '👏', userId: otherUsers[2]?.id || '' },
          { emoji: '💎', userId: otherUsers[0]?.id || '' },
        ],
        seenBy: otherUsers.slice(0, 1).map((u) => u.id),
      },
      {
        id: 'group2-msg-8',
        conversationId: 'group-2',
        senderId: otherUsers[1]?.id || '',
        message: 'Anyone up for ranked tonight? 🎮',
        createdAt: new Date(Date.now() - 600000),
        read: false,
        seenBy: [],
      },
    ],
    'group-3': [
      {
        id: 'group3-msg-0',
        conversationId: 'group-3',
        senderId: otherUsers[0]?.id || '',
        message: 'Morning everyone! Coffee run in 15? ☕',
        createdAt: new Date(Date.now() - 21600000),
        read: true,
        reactions: [{ emoji: '☕', userId: currentUserId }],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group3-msg-1',
        conversationId: 'group-3',
        senderId: otherUsers[1]?.id || '',
        message: 'Yes please! Get me a latte 🙏',
        createdAt: new Date(Date.now() - 18000000),
        read: true,
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group3-msg-2',
        conversationId: 'group-3',
        senderId: currentUserId,
        message:
          'Same! Actually, can we do lunch instead? Have back-to-back meetings until noon 😅',
        createdAt: new Date(Date.now() - 14400000),
        read: true,
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group3-msg-3',
        conversationId: 'group-3',
        senderId: otherUsers[2]?.id || '',
        message: 'Lunch works! That new Italian place?',
        createdAt: new Date(Date.now() - 10800000),
        read: true,
        reactions: [
          { emoji: '🍝', userId: currentUserId },
          { emoji: '😋', userId: otherUsers[0]?.id || '' },
        ],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group3-msg-4',
        conversationId: 'group-3',
        senderId: otherUsers[0]?.id || '',
        message: "Heard their pasta is amazing! Let's do it.",
        createdAt: new Date(Date.now() - 9000000),
        read: true,
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group3-msg-5',
        conversationId: 'group-3',
        senderId: currentUserId,
        message: 'Lunch at 12:30? 🍕',
        createdAt: new Date(Date.now() - 7200000),
        read: true,
        reactions: [
          { emoji: '👍', userId: otherUsers[0]?.id || '' },
          { emoji: '✅', userId: otherUsers[1]?.id || '' },
        ],
        seenBy: otherUsers.map((u) => u.id),
      },
    ],
    'group-4': [
      {
        id: 'group4-msg-0',
        conversationId: 'group-4',
        senderId: otherUsers[0]?.id || '',
        message: 'Has everyone started reading "The Midnight Library"? 📖',
        createdAt: new Date(Date.now() - 172800000),
        read: true,
        reactions: [{ emoji: '📚', userId: currentUserId }],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group4-msg-1',
        conversationId: 'group-4',
        senderId: currentUserId,
        message: 'Just started! The premise is so intriguing.',
        createdAt: new Date(Date.now() - 158400000),
        read: true,
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group4-msg-2',
        conversationId: 'group-4',
        senderId: otherUsers[1]?.id || '',
        message: "I'm on chapter 3. No spoilers please! 🤐",
        createdAt: new Date(Date.now() - 144000000),
        read: true,
        reactions: [{ emoji: '🤐', userId: currentUserId }],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group4-msg-3',
        conversationId: 'group-4',
        senderId: otherUsers[2]?.id || '',
        message:
          "This author's writing style is beautiful. The metaphors are so poetic!",
        createdAt: new Date(Date.now() - 86400000),
        read: true,
        reactions: [{ emoji: '❤️', userId: otherUsers[0]?.id || '' }],
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group4-msg-4',
        conversationId: 'group-4',
        senderId: currentUserId,
        message:
          'Agreed! It makes you think about all the "what ifs" in life...',
        createdAt: new Date(Date.now() - 43200000),
        read: true,
        seenBy: otherUsers.map((u) => u.id),
      },
      {
        id: 'group4-msg-5',
        conversationId: 'group-4',
        senderId: otherUsers[0]?.id || '',
        message: "Let's schedule our book discussion for next Friday? 📅",
        createdAt: new Date(Date.now() - 21600000),
        read: true,
        reactions: [
          { emoji: '👍', userId: currentUserId },
          { emoji: '✅', userId: otherUsers[1]?.id || '' },
        ],
        seenBy: otherUsers.slice(0, 2).map((u) => u.id),
      },
      {
        id: 'group4-msg-6',
        conversationId: 'group-4',
        senderId: otherUsers[2]?.id || '',
        message: 'Just finished chapter 5, mind-blowing twist! 🤯',
        createdAt: new Date(Date.now() - 3600000),
        read: false,
        seenBy: [],
      },
    ],
  };

  return groupMessageSets[conversationId] || [];
};

// Main function to create mock messages
const createMockMessages = (
  conversationId: string,
  currentUserId: string,
  otherUserIds: string[],
  isGroup: boolean,
  otherUsers?: User[],
): Message[] => {
  if (isGroup && otherUsers) {
    return createGroupMessages(conversationId, currentUserId, otherUsers);
  }
  return createDirectMessages(
    conversationId,
    currentUserId,
    otherUserIds[0] || '',
  );
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      conversations: [],
      activeConversation: null,
      messages: [],
      onlineUsers: [],
      typingUsers: {},
      searchResults: [],
      isLoading: false,
      deletedMessages: [],
      editedMessages: [],

      seedConversationsIfNeeded: () => {
        const { user, conversations } = get();
        if (!user) return;
        if (conversations.length > 0) return;

        const seeded = createMockConversations(user.id, user);
        set({
          conversations: seeded,
          onlineUsers: mockUsers
            .filter((u) => u.status === 'online')
            .map((u) => u.id),
        });
      },

      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        const user = mockUsers.find((u) => u.email === email) || {
          id: 'current-user',
          name: email.split('@')[0],
          email,
          picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          status: 'online' as const,
          about: 'Hey there! I am using WhatsUp',
        };

        const conversations = createMockConversations(user.id, user);

        set({
          user,
          token: 'mock-token-' + Date.now(),
          conversations,
          onlineUsers: mockUsers
            .filter((u) => u.status === 'online')
            .map((u) => u.id),
        });

        return true;
      },

      register: async (name: string, email: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const user: User = {
          id: 'user-' + Date.now(),
          name,
          email,
          picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          status: 'online',
          about: 'Hey there! I am using WhatsUp',
        };

        const conversations = createMockConversations(user.id, user);

        set({
          user,
          token: 'mock-token-' + Date.now(),
          conversations,
          onlineUsers: mockUsers
            .filter((u) => u.status === 'online')
            .map((u) => u.id),
        });

        return true;
      },

      logout: () => {
        set({
          user: null,
          token: null,
          conversations: [],
          activeConversation: null,
          messages: [],
          onlineUsers: [],
          typingUsers: {},
          searchResults: [],
        });
      },

      setActiveConversation: (conversation) => {
        if (conversation) {
          const currentUser = get().user;
          const otherUsers = conversation.users.filter(
            (u) => u.id !== currentUser?.id,
          );
          const otherUserIds = otherUsers.map((u) => u.id);
          const messages = createMockMessages(
            conversation.id,
            currentUser?.id || '',
            otherUserIds,
            conversation.isGroup,
            otherUsers,
          );

          set({
            activeConversation: conversation,
            messages,
          });

          // Mark as read
          get().markAsRead(conversation.id);
        } else {
          set({ activeConversation: null, messages: [] });
        }
      },

      sendMessage: (
        message: string,
        files?: File[],
        replyTo?: {
          messageId: string;
          senderId: string;
          senderName: string;
          message: string;
        },
      ) => {
        const { activeConversation, user, messages } = get();
        if (!activeConversation || !user) return;

        const newMessage: Message = {
          id: 'msg-' + Date.now(),
          conversationId: activeConversation.id,
          senderId: user.id,
          message,
          createdAt: new Date(),
          read: false,
          files: files?.map((file, i) => ({
            id: `file-${Date.now()}-${i}`,
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file),
            size: file.size,
          })),
          replyTo,
        };

        set({
          messages: [...messages, newMessage],
          conversations: get().conversations.map((conv) =>
            conv.id === activeConversation.id
              ? { ...conv, latestMessage: newMessage, unreadCount: 0 }
              : conv,
          ),
        });

        // Simulate typing indicator before reply
        const otherUsers = activeConversation.users.filter(
          (u) => u.id !== user.id,
        );
        const typingUser =
          otherUsers[Math.floor(Math.random() * otherUsers.length)];

        if (
          typingUser &&
          get().activeConversation?.id === activeConversation.id
        ) {
          // Show typing indicator after a short delay
          setTimeout(() => {
            if (get().activeConversation?.id === activeConversation.id) {
              set((state) => ({
                typingUsers: {
                  ...state.typingUsers,
                  [activeConversation.id]: [typingUser.id],
                },
              }));
            }
          }, 800);

          // Simulate reply after typing
          setTimeout(
            () => {
              // Clear typing indicator
              set((state) => ({
                typingUsers: {
                  ...state.typingUsers,
                  [activeConversation.id]: [],
                },
              }));

              if (get().activeConversation?.id === activeConversation.id) {
                const replies = [
                  'Got it! 👍',
                  'Interesting...',
                  'Let me think about that.',
                  'Sounds good!',
                  'I agree!',
                  '😊',
                  'Thanks for letting me know!',
                ];

                const replyMessageText =
                  replies[Math.floor(Math.random() * replies.length)];

                const replyMessage: Message = {
                  id: 'msg-' + Date.now(),
                  conversationId: activeConversation.id,
                  senderId: typingUser.id,
                  message: replyMessageText,
                  createdAt: new Date(),
                  read: false,
                };

                set((state) => ({
                  messages: [...state.messages, replyMessage],
                  conversations: state.conversations.map((conv) =>
                    conv.id === activeConversation.id
                      ? { ...conv, latestMessage: replyMessage }
                      : conv,
                  ),
                }));

                // Trigger notification for new message
                notificationService.showNotification(typingUser.name, {
                  body: replyMessageText,
                  icon: typingUser.picture,
                  tag: `message-${replyMessage.id}`,
                });
              }
            },
            2500 + Math.random() * 1500,
          );
        }
      },

      searchUsers: (query: string) => {
        if (!query.trim()) {
          set({ searchResults: [] });
          return;
        }

        const { user } = get();
        const results = mockUsers.filter(
          (u) =>
            u.id !== user?.id &&
            (u.name.toLowerCase().includes(query.toLowerCase()) ||
              u.email.toLowerCase().includes(query.toLowerCase())),
        );

        set({ searchResults: results });
      },

      createConversation: (userId: string) => {
        const { user, conversations } = get();
        if (!user) return;

        const existingConv = conversations.find(
          (conv) => !conv.isGroup && conv.users.some((u) => u.id === userId),
        );

        if (existingConv) {
          get().setActiveConversation(existingConv);
          return;
        }

        const targetUser = mockUsers.find((u) => u.id === userId);
        if (!targetUser) return;

        const newConversation: Conversation = {
          id: 'conv-' + Date.now(),
          name: targetUser.name,
          picture: targetUser.picture,
          isGroup: false,
          users: [user, targetUser],
          unreadCount: 0,
          createdAt: new Date(),
        };

        set({
          conversations: [newConversation, ...conversations],
          searchResults: [],
        });

        get().setActiveConversation(newConversation);
      },

      createGroup: (name: string, userIds: string[]) => {
        const { user, conversations } = get();
        if (!user) return;

        const groupUsers = [
          user,
          ...mockUsers.filter((u) => userIds.includes(u.id)),
        ];

        const newGroup: Conversation = {
          id: 'group-' + Date.now(),
          name,
          picture: `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`,
          isGroup: true,
          users: groupUsers,
          admin: user.id,
          unreadCount: 0,
          createdAt: new Date(),
        };

        set({
          conversations: [newGroup, ...conversations],
        });

        get().setActiveConversation(newGroup);
      },

      setTyping: (conversationId: string, isTyping: boolean) => {
        const { user, typingUsers } = get();
        if (!user) return;

        const currentTyping = typingUsers[conversationId] || [];

        set({
          typingUsers: {
            ...typingUsers,
            [conversationId]: isTyping
              ? [...currentTyping, user.id]
              : currentTyping.filter((id) => id !== user.id),
          },
        });
      },

      markAsRead: (conversationId: string) => {
        set({
          conversations: get().conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        });
      },

      updateUserStatus: (status: 'online' | 'offline' | 'away') => {
        const { user } = get();
        if (!user) return;

        set({ user: { ...user, status } });
      },

      updateProfile: (
        updates: Partial<Pick<User, 'name' | 'about' | 'picture'>>,
      ) => {
        const { user, conversations } = get();
        if (!user) return;

        const updatedUser = { ...user, ...updates };

        // Also update user in conversations
        set({
          user: updatedUser,
          conversations: conversations.map((conv) => ({
            ...conv,
            users: conv.users.map((u) => (u.id === user.id ? updatedUser : u)),
          })),
        });
      },

      addReaction: (messageId: string, emoji: string) => {
        const { user, messages } = get();
        if (!user) return;

        set({
          messages: messages.map((msg) => {
            if (msg.id !== messageId) return msg;

            const existingReactions = msg.reactions || [];
            const hasReacted = existingReactions.some(
              (r) => r.emoji === emoji && r.userId === user.id,
            );

            if (hasReacted) {
              // Remove reaction if already exists
              return {
                ...msg,
                reactions: existingReactions.filter(
                  (r) => !(r.emoji === emoji && r.userId === user.id),
                ),
              };
            }

            // Add new reaction
            return {
              ...msg,
              reactions: [...existingReactions, { emoji, userId: user.id }],
            };
          }),
        });
      },

      removeReaction: (messageId: string, emoji: string) => {
        const { user, messages } = get();
        if (!user) return;

        set({
          messages: messages.map((msg) => {
            if (msg.id !== messageId) return msg;

            return {
              ...msg,
              reactions: (msg.reactions || []).filter(
                (r) => !(r.emoji === emoji && r.userId === user.id),
              ),
            };
          }),
        });
      },

      editMessage: (messageId: string, newMessage: string) => {
        const { user, messages, editedMessages } = get();
        if (!user) return;

        const messageToEdit = messages.find((m) => m.id === messageId);
        if (!messageToEdit || messageToEdit.senderId !== user.id) return;

        const originalMessage =
          messageToEdit.originalMessage || messageToEdit.message;

        // Clear existing timeout if re-editing
        const existingEdit = editedMessages.find(
          (e) => e.messageId === messageId,
        );
        if (existingEdit) {
          clearTimeout(existingEdit.timeout);
        }

        // Set timeout to remove undo option after 10 seconds
        const timeout = setTimeout(() => {
          set((state) => ({
            editedMessages: state.editedMessages.filter(
              (e) => e.messageId !== messageId,
            ),
            messages: state.messages.map((m) =>
              m.id === messageId ? { ...m, originalMessage: undefined } : m,
            ),
          }));
        }, 10000);

        set({
          messages: messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              message: newMessage,
              isEdited: true,
              editedAt: new Date(),
              originalMessage,
            };
          }),
          editedMessages: [
            ...editedMessages.filter((e) => e.messageId !== messageId),
            { messageId, originalMessage, timeout },
          ],
        });
      },

      deleteMessage: (messageId: string) => {
        const { user, messages, deletedMessages } = get();
        if (!user) return;

        const messageToDelete = messages.find((m) => m.id === messageId);
        if (!messageToDelete || messageToDelete.senderId !== user.id) return;

        // Set timeout to permanently remove after 10 seconds
        const timeout = setTimeout(() => {
          set((state) => ({
            deletedMessages: state.deletedMessages.filter(
              (d) => d.message.id !== messageId,
            ),
          }));
        }, 10000);

        set({
          messages: messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              isDeleted: true,
              deletedAt: new Date(),
            };
          }),
          deletedMessages: [
            ...deletedMessages,
            { message: messageToDelete, timeout },
          ],
        });
      },

      undoDeleteMessage: (messageId: string) => {
        const { messages, deletedMessages } = get();

        const deletedEntry = deletedMessages.find(
          (d) => d.message.id === messageId,
        );
        if (!deletedEntry) return;

        clearTimeout(deletedEntry.timeout);

        set({
          messages: messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              isDeleted: false,
              deletedAt: undefined,
            };
          }),
          deletedMessages: deletedMessages.filter(
            (d) => d.message.id !== messageId,
          ),
        });
      },

      undoEditMessage: (messageId: string) => {
        const { messages, editedMessages } = get();

        const editedEntry = editedMessages.find(
          (e) => e.messageId === messageId,
        );
        if (!editedEntry) return;

        clearTimeout(editedEntry.timeout);

        set({
          messages: messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              message: editedEntry.originalMessage,
              isEdited: false,
              editedAt: undefined,
              originalMessage: undefined,
            };
          }),
          editedMessages: editedMessages.filter(
            (e) => e.messageId !== messageId,
          ),
        });
      },

      forwardMessage: (messageId: string, toConversationId: string) => {
        const { user, messages, conversations } = get();
        if (!user) return;

        const messageToForward = messages.find((m) => m.id === messageId);
        const targetConversation = conversations.find(
          (c) => c.id === toConversationId,
        );

        if (!messageToForward || !targetConversation) return;

        const forwardedMessage: Message = {
          id:
            'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          conversationId: toConversationId,
          senderId: user.id,
          message: messageToForward.message,
          files: messageToForward.files,
          createdAt: new Date(),
          read: false,
        };

        // Update the target conversation's latest message
        set({
          conversations: conversations.map((conv) =>
            conv.id === toConversationId
              ? { ...conv, latestMessage: forwardedMessage }
              : conv,
          ),
        });
      },

      pinMessage: (messageId: string) => {
        const { user, messages } = get();
        if (!user) return;

        set({
          messages: messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              isPinned: true,
              pinnedAt: new Date(),
              pinnedBy: user.id,
            };
          }),
        });
      },

      unpinMessage: (messageId: string) => {
        const { messages } = get();

        set({
          messages: messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              isPinned: false,
              pinnedAt: undefined,
              pinnedBy: undefined,
            };
          }),
        });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
