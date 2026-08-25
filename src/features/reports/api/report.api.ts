import { api } from '@/lib/api/axios';
import { z } from 'zod';

export const reportSchema = z.object({
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  output: z.string().min(5, 'Output minimal 5 karakter'),
  obstacles: z.string().optional(),
  notes: z.string().optional(),
  tasks: z.array(z.any()).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const reportApi = {
  create: async (data: ReportInput) => {
    const response = await api.post('/daily-reports', data);
    return response.data;
  },
  
  getMyReports: async (params?: any) => {
    const response = await api.get('/daily-reports/me', { params });
    return response.data;
  },
  getLockedReports: async (params?: any) => {
    const response = await api.get('/daily-reports/locked', { params });
    return response.data;
  },
  unlockReport: async (id: string) => {
    const response = await api.patch(`/daily-reports/${id}/unlock`);
    return response.data;
  },
};

