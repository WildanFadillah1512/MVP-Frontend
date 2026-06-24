"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { User, Phone, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    photoUrl: '',
    phone: '',
    bio: ''
  });

  const [userContext, setUserContext] = useState<any>(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserContext(u);
      setForm({
        photoUrl: u.photoUrl || '',
        phone: u.phone || '',
        bio: u.bio || ''
      });
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.patch('/users/profile', form);
      if (res.data.success) {
        toast.success('Profil berhasil diperbarui');
        // Update local storage
        const updatedUser = { ...userContext, ...res.data.data };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUserContext(updatedUser);
        
        // Refresh to update sidebar/header image
        window.location.reload();
      }
    } catch (error) {
      toast.error('Gagal memperbarui profil');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !userContext) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <User className="w-8 h-8 text-brand-primary" /> Pengaturan Profil
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Perbarui foto, nomor telepon, dan bio Anda.</p>
      </div>

      <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Informasi Pribadi</CardTitle>
          <CardDescription>
            Informasi {userContext.name} - {userContext.role?.name} ({userContext.division?.name})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Photo Preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-inner">
                  {form.photoUrl ? (
                    <img src={form.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Foto Profil</span>
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-slate-400" /> URL Foto Profil
                  </Label>
                  <Input 
                    value={form.photoUrl} 
                    onChange={e => setForm({...form, photoUrl: e.target.value})} 
                    placeholder="https://contoh.com/foto.jpg" 
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">Masukkan tautan/URL gambar yang valid.</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> Nomor Telepon / WA
                  </Label>
                  <Input 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})} 
                    placeholder="08123456789" 
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-slate-600 dark:text-slate-300">Bio / Tentang Saya</Label>
              <Textarea 
                value={form.bio} 
                onChange={e => setForm({...form, bio: e.target.value})} 
                placeholder="Tuliskan sedikit tentang diri Anda..." 
                className="rounded-xl min-h-[120px] resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" disabled={isSaving} className="rounded-xl bg-brand-primary hover:bg-brand-primary/90 min-w-[150px]">
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

