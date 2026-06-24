import { api } from '@/lib/api/axios';

export const productionApi = {
  getProducts: async () => {
    const response = await api.get('/production/products');
    return response.data;
  },
  
  getRecords: async () => {
    const response = await api.get('/production/records');
    return response.data;
  },

  createRecord: async (data: any) => {
    const response = await api.post('/production/records', data);
    return response.data;
  },
  
  useMaterials: async (data: any) => {
    const response = await api.post('/production/materials/use', data);
    return response.data;
  }
};

