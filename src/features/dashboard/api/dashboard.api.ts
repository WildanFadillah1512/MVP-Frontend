import { api } from '@/lib/api/axios';

export const dashboardApi = {
  getCeoData: async () => {
    const response = await api.get('/dashboard/ceo');
    return response.data;
  },
  getManagerData: async () => {
    const response = await api.get('/dashboard/manager');
    return response.data;
  },
  getLeaderData: async () => {
    const response = await api.get('/dashboard/leader');
    return response.data;
  },
  getStaffData: async () => {
    const response = await api.get('/dashboard/staff');
    return response.data;
  }
};
