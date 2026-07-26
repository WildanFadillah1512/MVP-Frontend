"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Upload, User, Phone, Image as ImageIcon, Loader2, Send, FileText, Download } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { uploadApi } from '@/features/uploads/api/upload.api';
import { useRouter } from 'next/navigation';
import { getRenderableImageUrl } from '@/lib/media/drive';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmittingResign, setIsSubmittingResign] = useState(false);
  const [documents, setDocuments] = useState<any>({ warnings: [], paklarings: [], payrolls: [] });
  const [photoVersion, setPhotoVersion] = useState(Date.now());
  
  const [form, setForm] = useState({
    photoUrl: '',
    phone: '',
    bio: ''
  });

  const [userContext, setUserContext] = useState<any>(null);
  const [resignForm, setResignForm] = useState({
    effectiveDate: '',
    reason: ''
  });

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
    api.get('/users/me/documents')
      .then((res) => {
        if (res.data.success) setDocuments(res.data.data);
      })
      .catch(() => {});
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WebP');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB');
      event.target.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await uploadApi.uploadProfilePhoto(file);
      if (res.success) {
        const nextForm = { ...form, photoUrl: res.data.fileUrl };
        const saveRes = await api.patch('/users/profile', nextForm);
        if (saveRes.data.success) {
          const updatedUser = { ...userContext, ...saveRes.data.data };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          setUserContext(updatedUser);
          setForm(nextForm);
          setPhotoVersion(Date.now());
          toast.success('Foto profil berhasil diperbarui');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal upload foto');
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const handleResignation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirm('Ajukan resign sekarang? Data akun akan dibackup otomatis dan atasan akan mendapat notifikasi.')) return;
    setIsSubmittingResign(true);
    try {
      const res = await api.post('/users/resignation', resignForm);
      if (res.data.success) {
        toast.success(res.data.message || 'Pengajuan resign berhasil dikirim');
        setResignForm({ effectiveDate: '', reason: '' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengajukan resign');
    } finally {
      setIsSubmittingResign(false);
    }
  };

  if (loading || !userContext) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const previewPhotoUrl = getRenderableImageUrl(form.photoUrl);
  const previewPhotoWithVersion = previewPhotoUrl
    ? `${previewPhotoUrl}${previewPhotoUrl.includes('?') ? '&' : '?'}v=${photoVersion}`
    : '';

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="w-8 h-8 text-primary" /> Pengaturan Profil
        </h1>
        <p className="text-muted-foreground mt-1">Perbarui foto, nomor telepon, dan bio Anda.</p>
      </div>

      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="text-xl font-bold text-foreground">Informasi Pribadi</CardTitle>
          <CardDescription>
            Informasi {userContext.name} - {userContext.role?.name} ({userContext.division?.name})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Photo Preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-2xl bg-muted border-2 border-dashed border-slate-300  overflow-hidden flex items-center justify-center shadow-inner">
                  {previewPhotoWithVersion ? (
                    <img src={previewPhotoWithVersion} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">Foto Profil</span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50">
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploadingPhoto ? 'Mengupload...' : 'Upload Foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                  />
                </label>
                <span className="text-[11px] text-muted-foreground">JPG, PNG, WebP. Maksimal 2MB.</span>
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <Label className="font-medium text-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" /> URL Foto Profil
                  </Label>
                  <Input 
                    value={form.photoUrl} 
                    onChange={e => setForm({...form, photoUrl: e.target.value})} 
                    placeholder="https://contoh.com/foto.jpg" 
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">Upload foto akan langsung tersimpan ke akun.</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" /> Nomor Telepon / WA
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
              <Label className="font-medium text-foreground">Bio / Tentang Saya</Label>
              <Textarea 
                value={form.bio} 
                onChange={e => setForm({...form, bio: e.target.value})} 
                placeholder="Tuliskan sedikit tentang diri Anda..." 
                className="rounded-xl min-h-[120px] resize-none"
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" disabled={isSaving} className="rounded-xl bg-primary hover:bg-primary/90 min-w-[150px]">
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <FileText className="w-5 h-5 text-primary" />
            Dokumen Saya
          </CardTitle>
          <CardDescription>SP, paklaring, dan slip gaji yang diterbitkan untuk akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3">
            {[...(documents.warnings || []).map((doc: any) => ({
              id: doc.id,
              type: doc.type || 'SP',
              title: doc.reason,
              subtitle: `Diterbitkan oleh ${doc.issuedBy?.name || 'CEO'} - berlaku sampai ${new Date(doc.expiresAt).toLocaleDateString('id-ID')}`,
              href: ''
            })), ...(documents.paklarings || []).map((doc: any) => ({
              id: doc.id,
              type: 'Paklaring',
              title: doc.letterNumber,
              subtitle: `${doc.position} - ${doc.department}`,
              href: doc.pdfUrl || ''
            })), ...(documents.payrolls || []).map((doc: any) => ({
              id: doc.id,
              type: 'Slip Gaji',
              title: new Date(doc.period).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
              subtitle: `Status ${doc.status} - Rp ${Number(doc.totalSalary || 0).toLocaleString('id-ID')}`,
              href: ''
            }))].length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada dokumen untuk akun ini.
              </p>
            ) : (
              [...(documents.warnings || []).map((doc: any) => ({
                id: doc.id,
                type: doc.type || 'SP',
                title: doc.reason,
                subtitle: `Diterbitkan oleh ${doc.issuedBy?.name || 'CEO'} - berlaku sampai ${new Date(doc.expiresAt).toLocaleDateString('id-ID')}`,
                href: ''
              })), ...(documents.paklarings || []).map((doc: any) => ({
                id: doc.id,
                type: 'Paklaring',
                title: doc.letterNumber,
                subtitle: `${doc.position} - ${doc.department}`,
                href: doc.pdfUrl || ''
              })), ...(documents.payrolls || []).map((doc: any) => ({
                id: doc.id,
                type: 'Slip Gaji',
                title: new Date(doc.period).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
                subtitle: `Status ${doc.status} - Rp ${Number(doc.totalSalary || 0).toLocaleString('id-ID')}`,
                href: ''
              }))].map((doc: any) => (
                <div key={`${doc.type}-${doc.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{doc.type}</p>
                    <p className="font-semibold text-foreground">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.subtitle}</p>
                  </div>
                  {doc.href && (
                    <a href={doc.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted/50">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="text-xl font-bold text-foreground">Pengajuan Resign</CardTitle>
          <CardDescription>
            Pengajuan akan membuat backup otomatis dan mengirim notifikasi ke atasan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleResignation} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Tanggal Efektif Resign</Label>
              <Input
                type="date"
                value={resignForm.effectiveDate}
                onChange={(event) => setResignForm({ ...resignForm, effectiveDate: event.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Alasan</Label>
              <Textarea
                value={resignForm.reason}
                onChange={(event) => setResignForm({ ...resignForm, reason: event.target.value })}
                required
                className="rounded-xl min-h-[100px] resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="destructive" disabled={isSubmittingResign} className="rounded-xl min-w-[170px]">
                {isSubmittingResign ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                ) : (
                  <><Send className="w-4 h-4" /> Ajukan Resign</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

