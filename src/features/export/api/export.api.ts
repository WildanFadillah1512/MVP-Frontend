import { api } from '@/lib/api/axios';

export const exportApi = {
  exportAttendances: async () => {
    const response = await api.get('/export/attendances', { responseType: 'blob' });
    return response;
  },
  exportProduction: async () => {
    const response = await api.get('/export/production', { responseType: 'blob' });
    return response;
  },
  exportAllStatistics: async () => {
    const response = await api.get('/export/all-statistics', { responseType: 'blob' });
    return response;
  }
};

