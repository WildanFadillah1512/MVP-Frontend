import { api } from '@/lib/api/axios';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  description?: string;
  workStartTime?: string;
  workEndTime?: string;
  createdAt: string;
}

export const holidayApi = {
  getHolidays: async () => {
    const response = await api.get('/holidays');
    return response.data;
  },

  createHoliday: async (data: Partial<Holiday>) => {
    const response = await api.post('/holidays', data);
    return response.data;
  },

  updateHoliday: async (id: string, data: Partial<Holiday>) => {
    const response = await api.put(`/holidays/${id}`, data);
    return response.data;
  },

  deleteHoliday: async (id: string) => {
    const response = await api.delete(`/holidays/${id}`);
    return response.data;
  }
};
