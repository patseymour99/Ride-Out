import { PublicUser } from './user.types';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl: string | null;
  createdAt: string;
  readAt: string | null;
  sender: PublicUser;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string | null;
  user: PublicUser;
}
