import { api } from '@/lib/api/axios';

export const attendanceApi = {
  checkIn: async (data: { latitude: number; longitude: number }) => {
    const response = await api.post('/attendances/check-in', data);
    return response.data;
  },
  
  checkOut: async (data: { latitude: number; longitude: number }) => {
    const response = await api.post('/attendances/check-out', data);
    return response.data;
  },

  getMyAttendance: async (params?: any) => {
    const response = await api.get('/attendances/me', { params });
    return response.data;
  },

  getLocations: async () => {
    const response = await api.get('/attendances/locations');
    return response.data;
  },

  startBreak: async () => {
    const response = await api.post('/attendances/break/start');
    return response.data;
  },

  endBreak: async () => {
    const response = await api.post('/attendances/break/end');
    return response.data;
  }
};

