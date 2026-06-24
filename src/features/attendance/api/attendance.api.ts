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

  getMyAttendance: async () => {
    const response = await api.get('/attendances/me');
    return response.data;
  },

  getLocations: async () => {
    const response = await api.get('/attendances/locations');
    return response.data;
  }
};
