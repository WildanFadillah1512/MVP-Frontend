import { api } from '@/lib/api/axios';

export const productionApi = {
  getProducts: async () => {
    const response = await api.get('/production/products');
    return response.data;
  },
  createProduct: async (data: any) => {
    const response = await api.post('/production/products', data);
    return response.data;
  },
  
  getRecords: async (params?: any) => {
    const response = await api.get('/production/records', { params });
    return response.data;
  },
  getStockSummary: async () => {
    const response = await api.get('/production/stock');
    return response.data;
  },
  setInitialStock: async (data: any) => {
    const response = await api.post('/production/stock/initial', data);
    return response.data;
  },

  createRecord: async (data: any) => {
    const response = await api.post('/production/records', data);
    return response.data;
  },
  createRecordsBulk: async (records: any[]) => {
    const response = await api.post('/production/records/bulk', { records });
    return response.data;
  },
  getTargets: async (params?: any) => {
    const response = await api.get('/production/targets', { params });
    return response.data;
  },
  createTarget: async (data: any) => {
    const response = await api.post('/production/targets', data);
    return response.data;
  },
  
  useMaterials: async (data: any) => {
    const response = await api.post('/production/materials/use', data);
    return response.data;
  }
};

