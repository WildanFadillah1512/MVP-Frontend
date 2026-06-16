import { api } from '@/lib/api/axios';
import { z } from 'zod';

export const leaveSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(5, 'Alasan minimal 5 karakter'),
});

export type LeaveInput = z.infer<typeof leaveSchema>;

export const leaveApi = {
  create: async (data: LeaveInput) => {
    const response = await api.post('/leaves', data);
    return response.data;
  },
  
  getMyLeaves: async () => {
    const response = await api.get('/leaves/me');
    return response.data;
  },

  getTeamLeaves: async () => {
    const response = await api.get('/leaves/team');
    return response.data;
  },

  approveLeave: async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const response = await api.patch(`/leaves/${id}/approve`, { status });
    return response.data;
  }
};
