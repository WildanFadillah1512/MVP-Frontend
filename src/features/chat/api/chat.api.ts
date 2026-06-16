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
  sendMessage: async (groupId: string, content: string) => {
    const response = await api.post(`/chat/groups/${groupId}/messages`, { content });
    return response.data;
  }
};
