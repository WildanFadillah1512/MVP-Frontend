import { api } from '@/lib/api/axios';

export const warehouseApi = {
  getItems: async () => {
    const response = await api.get('/warehouse/items');
    return response.data;
  },
  getMovements: async () => {
    const response = await api.get('/warehouse/movements');
    return response.data;
  },
  createMovement: async (data: any) => {
    const response = await api.post('/warehouse/movements', data);
    return response.data;
  },
  getRecommendations: async () => {
    const response = await api.get('/warehouse/recommendations');
    return response.data;
  }
};
