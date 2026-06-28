import { api } from '@/lib/api/axios';
import { z } from 'zod';

export const reportSchema = z.object({
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  output: z.string().min(5, 'Output minimal 5 karakter'),
  obstacles: z.string().optional(),
  notes: z.string().optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const reportApi = {
  create: async (data: ReportInput) => {
    const response = await api.post('/daily-reports', data);
    return response.data;
  },
  
  getMyReports: async () => {
    const response = await api.get('/daily-reports/me');
    return response.data;
  },
  getLockedReports: async () => {
    const response = await api.get('/daily-reports/locked');
    return response.data;
  },
  unlockReport: async (id: string) => {
    const response = await api.patch(`/daily-reports/${id}/unlock`);
    return response.data;
  },
};

