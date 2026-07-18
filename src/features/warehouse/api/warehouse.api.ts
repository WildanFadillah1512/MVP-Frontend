import { api } from '@/lib/api/axios';

export const warehouseApi = {
  getItems: async () => {
    const response = await api.get('/warehouse/items');
    return response.data;
  },
  createItem: async (data: any) => {
    const response = await api.post('/warehouse/items', data);
    return response.data;
  },
  deleteItem: async (id: string) => {
    const response = await api.delete(`/warehouse/items/${id}`);
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

