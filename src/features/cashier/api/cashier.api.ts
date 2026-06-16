import { api } from '@/lib/api/axios';

export const cashierApi = {
  getBranches: async () => {
    const response = await api.get('/cashier/branches');
    return response.data;
  },
  getReports: async () => {
    const response = await api.get('/cashier/reports');
    return response.data;
  },
  createReport: async (data: any) => {
    const response = await api.post('/cashier/reports', data);
    return response.data;
  }
};
