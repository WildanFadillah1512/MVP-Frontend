import { api } from '@/lib/api/axios';

export const purchasingApi = {
  getNeeds: async () => {
    const response = await api.get('/purchasing/needs');
    return response.data;
  },
  createNeed: async (data: any) => {
    const response = await api.post('/purchasing/needs', data);
    return response.data;
  },
  updateNeedStatus: async (id: string, status: string) => {
    const response = await api.patch(`/purchasing/needs/${id}/status`, { status });
    return response.data;
  },
  
  getPurchases: async () => {
    const response = await api.get('/purchasing/history');
    return response.data;
  },
  createPurchase: async (data: any) => {
    const response = await api.post('/purchasing/history', data);
    return response.data;
  }
};

