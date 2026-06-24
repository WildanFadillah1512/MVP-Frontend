import { api } from '@/lib/api/axios';

export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/daily-uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  getMyUploads: async () => {
    const response = await api.get('/daily-uploads/me');
    return response.data;
  }
};

