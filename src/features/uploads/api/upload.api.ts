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

  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/file-upload/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  uploadChatFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/file-upload/chat-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  uploadGenericFile: async (file: File, folderType = 'GENERAL') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderType', folderType);

    const response = await api.post('/file-upload/generic', formData, {
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

