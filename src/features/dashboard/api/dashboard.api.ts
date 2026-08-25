import { api } from '@/lib/api/axios';

export const dashboardApi = {
  getCeoData: async () => {
    const response = await api.get('/dashboard/ceo');
    return response.data;
  },
  getOwnerData: async () => {
    const response = await api.get('/dashboard/owner');
    return response.data;
  },
  getGmData: async () => {
    const response = await api.get('/dashboard/gm');
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
  },
  getProductionStats: async () => {
    const response = await api.get('/dashboard/production-stats');
    return response.data;
  },
  getCriticalStock: async () => {
    const response = await api.get('/dashboard/critical-stock');
    return response.data;
  },
  getBranchPerformance: async () => {
    const response = await api.get('/dashboard/branch-performance');
    return response.data;
  },
  getEmployeeLeaderboard: async () => {
    const response = await api.get('/dashboard/employee-leaderboard');
    return response.data;
  },
  getEmployeeStatistics: async (id: string) => {
    const response = await api.get(`/dashboard/employees/${id}/statistics`);
    return response.data;
  },
  getMonthlyLeaderboard: async (month?: string) => {
    const response = await api.get('/dashboard/leaderboard', { params: { month } });
    return response.data;
  }
};

