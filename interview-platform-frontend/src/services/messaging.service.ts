import api from "@/lib/axios";
import { MESSAGING_ENDPOINTS } from "@/lib/api-endpoints";

export interface Conversation {
  id: string;
  title: string;
  type: "DIRECT" | "GROUP";
  participants: { id: string; firstName: string; lastName: string; email: string }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "TEXT" | "FILE" | "SYSTEM";
  parentMessageId?: string;
  isEdited: boolean;
  createdAt: string;
}

export const messagingService = {
  createConversation: async (data: { title?: string; participantIds: string[]; type?: string }): Promise<Conversation> => {
    const res = await api.post(MESSAGING_ENDPOINTS.createConversation, data);
    return res.data;
  },

  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get(MESSAGING_ENDPOINTS.getConversations);
    return res.data;
  },

  sendMessage: async (conversationId: string, data: { content: string; type?: string; parentMessageId?: string }): Promise<Message> => {
    const res = await api.post(MESSAGING_ENDPOINTS.sendMessage(conversationId), data);
    return res.data;
  },

  getMessages: async (conversationId: string, page = 0, size = 50): Promise<{ content: Message[]; totalElements: number }> => {
    const res = await api.get(MESSAGING_ENDPOINTS.getMessages(conversationId), { params: { page, size } });
    return res.data;
  },

  markAsRead: async (conversationId: string, messageId: string): Promise<void> => {
    await api.post(MESSAGING_ENDPOINTS.markAsRead(conversationId), null, { params: { messageId } });
  },

  getThreadReplies: async (messageId: string): Promise<Message[]> => {
    const res = await api.get(MESSAGING_ENDPOINTS.getThreadReplies(messageId));
    return res.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(MESSAGING_ENDPOINTS.deleteMessage(messageId));
  },
};
