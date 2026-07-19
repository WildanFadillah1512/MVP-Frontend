import { api } from '@/lib/api/axios';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Kode OTP harus 6 digit angka'),
});

export type OtpInput = z.infer<typeof otpSchema>;

export const authApi = {
  login: async (data: LoginInput) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  verifyOtp: async (data: { otpToken: string; code: string }) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

