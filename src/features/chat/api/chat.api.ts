import { api } from '@/lib/api/axios';

export const chatApi = {
  getGroups: async () => {
    const response = await api.get('/chat/groups');
    return response.data;
  },
  getMessages: async (groupId: string) => {
    const response = await api.get(`/chat/groups/${groupId}/messages`);
    return response.data;
  },
  sendMessage: async (groupId: string, content: string, attachment?: {
    fileUrl: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }) => {
    const response = await api.post(`/chat/groups/${groupId}/messages`, { content, ...attachment });
    return response.data;
  }
};

