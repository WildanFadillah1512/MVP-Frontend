import { api } from '@/lib/api/axios';

export const attendanceApi = {
  checkIn: async () => {
    const response = await api.post('/attendances/check-in');
    return response.data;
  },
  
  checkOut: async () => {
    const response = await api.post('/attendances/check-out');
    return response.data;
  },

  getMyAttendance: async () => {
    const response = await api.get('/attendances/me');
    return response.data;
  },
};
