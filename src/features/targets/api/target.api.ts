import { api } from '@/lib/api/axios';

export const targetApi = {
  // Create target for a single assignee
  createTarget: async (data: {
    assigneeId: string;
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
    period: string;
  }) => {
    // Backend expects userIds array; wrap single assigneeId
    const response = await api.post('/targets', {
      title: data.title,
      description: data.description,
      targetValue: data.targetValue,
      unit: data.unit,
      period: data.period,
      userIds: [data.assigneeId],
    });
    return response.data;
  },

  // Legacy create (keeps backward compat)
  create: async (data: {
    title: string;
    description?: string;
    period: string;
    targetValue: string;
    unit: string;
    userIds: string[];
  }) => {
    const response = await api.post('/targets', data);
    return response.data;
  },

  getMyTargets: async () => {
    const response = await api.get('/targets/me');
    return response.data;
  },

  getTeamTargets: async () => {
    const response = await api.get('/targets/team');
    return response.data;
  },

  updateProgress: async (id: string, currentValue: number) => {
    const response = await api.patch(`/targets/${id}`, { currentValue });
    return response.data;
  }
};
