"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { api } from '@/lib/api/axios';
import { uploadApi } from '@/features/uploads/api/upload.api';
import { Users, Plus, UserCheck, Search, Filter, Building2, Pencil, Trash2, KeyRound, Clock3, Megaphone, Upload, MessageSquare } from "lucide-react";
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ roles: [], divisions: [], supervisors: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [divisionName, setDivisionName] = useState('');
  const [creatingDivision, setCreatingDivision] = useState(false);
  const [branchForm, setBranchForm] = useState({ id: '', code: '', name: '', address: '' });
  const [editingBranchId, setEditingBranchId] = useState('');
  const [savingBranch, setSavingBranch] = useState(false);

  const emptyForm = { email: '', password: '', name: '', roleId: '', divisionId: '', branchId: 'none', shiftId: 'none', supervisorId: '', totalQuota: '12' };
  const [form, setForm] = useState(emptyForm);
  const [resignations, setResignations] = useState<any[]>([]);
  const [passwordTarget, setPasswordTarget] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [shiftForms, setShiftForms] = useState<Record<string, { startTime: string; endTime: string }>>({});
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    fileUrl: '',
    fileName: '',
    expiresAt: ''
  });
  const [eventThemeForm, setEventThemeForm] = useState({
    enabled: false,
    name: '',
    theme: 'default'
  });
  const [isUploadingAnnouncement, setIsUploadingAnnouncement] = useState(false);
  const [resignationMessages, setResignationMessages] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [usersRes, optRes, resignationRes, themeRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/options'),
        api.get('/users/resignations'),
        api.get('/settings/event-theme')
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (optRes.data.success) {
        setOptions(optRes.data.data);
        setShiftForms(Object.fromEntries((optRes.data.data.shifts || []).map((shift: any) => [
          shift.id,
          { startTime: shift.startTime, endTime: shift.endTime }
        ])));
      }
      if (resignationRes.data.success) setResignations(resignationRes.data.data);
      if (themeRes.data.success) setEventThemeForm(themeRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const current = JSON.parse(userStr);
      setUserRole(current.role?.name || '');
    }
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/users', form);
      if (res.data.success) {
        toast.success('User berhasil dibuat');
        setShowCreate(false);
        setForm(emptyForm);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisionName.trim()) return toast.error('Nama divisi wajib diisi');
    setCreatingDivision(true);
    try {
      const res = await api.post('/users/divisions', { name: divisionName });
      if (res.data.success) {
        toast.success('Divisi berhasil dibuat');
        setDivisionName('');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat divisi');
    } finally {
      setCreatingDivision(false);
    }
  };

  const resetBranchForm = () => {
    setBranchForm({ id: '', code: '', name: '', address: '' });
    setEditingBranchId('');
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.code.trim() || !branchForm.name.trim()) {
      return toast.error('Kode dan nama cabang wajib diisi');
    }

    setSavingBranch(true);
    try {
      const payload = {
        code: branchForm.code,
        name: branchForm.name,
        address: branchForm.address
      };
      const res = editingBranchId
        ? await api.patch(`/users/branches/${editingBranchId}`, payload)
        : await api.post('/users/branches', payload);

      if (res.data.success) {
        toast.success(editingBranchId ? 'Cabang berhasil diperbarui' : 'Cabang berhasil dibuat');
        resetBranchForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan cabang');
    } finally {
      setSavingBranch(false);
    }
  };

  const startEditBranch = (branch: any) => {
    setEditingBranchId(branch.id);
    setBranchForm({
      id: branch.id,
      code: branch.code || '',
      name: branch.name || '',
      address: branch.address || ''
    });
  };

  const handleDeleteBranch = async (branch: any) => {
    if (!confirm(`Hapus cabang ${branch.name}? Cabang tidak bisa dihapus jika masih dipakai karyawan atau laporan kasir.`)) return;

    try {
      const res = await api.delete(`/users/branches/${branch.id}`);
      if (res.data.success) {
        toast.success('Cabang berhasil dihapus');
        if (editingBranchId === branch.id) resetBranchForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus cabang');
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (currentActive && !confirm('Hapus/nonaktifkan akun ini? Akun tidak bisa login setelah dihapus.')) return;
    try {
      if (currentActive) {
        await api.delete(`/users/${userId}`);
        toast.success('User dinonaktifkan');
      } else {
        await api.patch(`/users/${userId}`, { isActive: true });
        toast.success('User diaktifkan kembali');
      }
      fetchData();
    } catch (error) {
      toast.error('Gagal mengubah status user');
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setForm({
      email: user.email || '',
      password: '',
      name: user.name || '',
      roleId: user.roleId || user.role?.id || '',
      divisionId: user.divisionId || user.division?.id || '',
      branchId: user.branchId || user.branch?.id || 'none',
      shiftId: user.shiftId || user.shift?.id || 'none',
      supervisorId: user.supervisorId || user.supervisor?.id || 'none',
      totalQuota: String(user.leaveBalances?.totalQuota ?? 12)
    });
    setShowEdit(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/users/${editingUser.id}`, {
        name: form.name,
        roleId: form.roleId,
        divisionId: form.divisionId,
        branchId: form.branchId,
        shiftId: form.shiftId,
        supervisorId: form.supervisorId,
        totalQuota: form.totalQuota
      });
      if (res.data.success) {
        toast.success('User berhasil diperbarui');
        setShowEdit(false);
        setEditingUser(null);
        setForm(emptyForm);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreateDivision = ['OWNER', 'CEO', 'GM', 'ADMIN'].includes(userRole);
  const canManageBranches = ['OWNER', 'CEO', 'ADMIN'].includes(userRole);
  const canEditDeleteUsers = ['OWNER', 'CEO', 'ADMIN'].includes(userRole);
  const canManageAnnouncements = ['OWNER', 'CEO', 'ADMIN'].includes(userRole);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/users/${passwordTarget.id}/password`, { password: newPassword });
      if (res.data.success) {
        toast.success('Password berhasil diperbarui');
        setPasswordTarget(null);
        setNewPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShiftUpdate = async (shift: any) => {
    const next = shiftForms[shift.id];
    if (!next?.startTime || !next?.endTime) {
      toast.error('Jam mulai dan selesai wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.put(`/shifts/${shift.id}`, {
        name: shift.name,
        startTime: next.startTime,
        endTime: next.endTime
      });
      if (res.data.success) {
        toast.success(`Shift ${shift.name} diperbarui`);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnnouncementUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingAnnouncement(true);
    try {
      const res = await uploadApi.uploadGenericFile(file, 'ANNOUNCEMENTS');
      if (res.success) {
        setAnnouncementForm((current) => ({
          ...current,
          fileUrl: res.data.fileUrl,
          fileName: res.data.fileName || file.name
        }));
        toast.success('Lampiran pengumuman berhasil diupload');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal upload lampiran');
    } finally {
      setIsUploadingAnnouncement(false);
      event.target.value = '';
    }
  };

  const handleCreateAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      toast.error('Judul dan isi pengumuman wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/announcements', announcementForm);
      if (res.data.success) {
        toast.success('Pengumuman dikirim ke semua karyawan');
        setAnnouncementForm({ title: '', message: '', fileUrl: '', fileName: '', expiresAt: '' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat pengumuman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEventTheme = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put('/settings/event-theme', eventThemeForm);
      if (res.data.success) {
        toast.success('Tema event berhasil diperbarui');
        document.documentElement.setAttribute('data-event-theme', res.data.data.enabled ? res.data.data.theme : 'default');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan tema event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResignationAction = async (request: any, status: 'APPROVED' | 'REJECTED' | 'PENDING', deleteAccount = false) => {
    if (deleteAccount && !confirm(`Hapus/nonaktifkan akun ${request.user.name}?`)) return;
    try {
      const res = await api.patch(`/users/resignations/${request.id}`, {
        status,
        deleteAccount,
        directMessage: resignationMessages[request.id] || ''
      });
      if (res.data.success) {
        toast.success('Pengajuan resign diperbarui');
        setResignationMessages((current) => ({ ...current, [request.id]: '' }));
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui resign');
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Kelola akun karyawan, hak akses, dan divisi.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md px-6 h-9">
              <Plus className="w-5 h-5" /> Tambah User
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-border">
              <DialogTitle className="text-2xl font-bold">Tambah User Baru</DialogTitle>
              <DialogDescription>
                Isi data karyawan secara lengkap untuk membuat akun baru.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Nama Lengkap</Label>
                  <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary" placeholder="Budi Santoso" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Email</Label>
                  <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary" placeholder="budi@company.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Password Default</Label>
                  <Input type="password" required placeholder="Minimal 6 karakter" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Kuota Cuti Tahunan (Hari)</Label>
                  <Input type="number" min="0" value={form.totalQuota} onChange={e => setForm({...form, totalQuota: e.target.value})} className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary" />
                </div>
              </div>
              
              <div className="p-4 bg-muted/30 dark:bg-muted/20 rounded-xl border border-primary/20 dark:border-primary/20 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Role Sistem</Label>
                    <Select required value={form.roleId} onValueChange={v => setForm({...form, roleId: v || ''})}>
                      <SelectTrigger className="rounded-xl overflow-hidden">
                        <SelectValue placeholder="Pilih hak akses...">
                          {form.roleId ? options.roles.find((r: any) => r.id === form.roleId)?.name : "Pilih hak akses..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {options.roles.map((r: any) => <SelectItem key={r.id} value={r.id} className="rounded-lg">{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Penempatan Divisi</Label>
                    <Select required value={form.divisionId} onValueChange={v => setForm({...form, divisionId: v || ''})}>
                      <SelectTrigger className="rounded-xl overflow-hidden">
                        <SelectValue placeholder="Pilih divisi...">
                          {form.divisionId ? options.divisions.find((d: any) => d.id === form.divisionId)?.name : "Pilih divisi..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {options.divisions.map((d: any) => <SelectItem key={d.id} value={d.id} className="rounded-lg">{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Cabang Karyawan</Label>
                  <Select value={form.branchId} onValueChange={v => setForm({...form, branchId: v || 'none'})}>
                    <SelectTrigger className="rounded-xl overflow-hidden">
                      <SelectValue placeholder="Pilih cabang...">
                        {form.branchId === 'none' ? 'Tidak ada cabang' : options.branches?.find((b: any) => b.id === form.branchId)?.name || 'Pilih cabang...'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Tidak ada cabang</SelectItem>
                      {(options.branches || []).map((b: any) => (
                        <SelectItem key={b.id} value={b.id} className="rounded-lg">{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Shift Kerja</Label>
                  <Select value={form.shiftId} onValueChange={v => setForm({...form, shiftId: v || 'none'})}>
                    <SelectTrigger className="rounded-xl overflow-hidden">
                      <SelectValue placeholder="Pilih shift...">
                        {form.shiftId === 'none' ? 'Belum ditentukan' : options.shifts?.find((shift: any) => shift.id === form.shiftId)?.name || 'Pilih shift...'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Belum ditentukan</SelectItem>
                      {(options.shifts || []).map((shift: any) => (
                        <SelectItem key={shift.id} value={shift.id} className="rounded-lg">
                          {shift.name} ({shift.startTime} - {shift.endTime})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Lapor Kepada (Atasan Langsung)</Label>
                  <Select value={form.supervisorId} onValueChange={v => setForm({...form, supervisorId: v || ''})}>
                    <SelectTrigger className="rounded-xl overflow-hidden">
                      <SelectValue placeholder="Tidak wajib (Pilih atasan...)">
                        {form.supervisorId === 'none' ? 'Tidak ada atasan' : 
                          form.supervisorId ? options.supervisors.find((s: any) => s.id === form.supervisorId)?.name : "Tidak wajib (Pilih atasan...)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Tidak ada atasan</SelectItem>
                      {options.supervisors.map((s: any) => <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name} <span className="text-muted-foreground">({s.role?.name || s.email})</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">Batal</Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Karyawan Baru'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
            <DialogDescription>
              Ubah role, divisi, cabang, atasan, dan kuota cuti karyawan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Nama Lengkap</Label>
                <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Email</Label>
                <Input value={form.email} disabled className="rounded-xl bg-muted/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Role Sistem</Label>
                <Select required value={form.roleId} onValueChange={v => setForm({...form, roleId: v || ''})}>
                  <SelectTrigger className="rounded-xl overflow-hidden">
                    <SelectValue placeholder="Pilih hak akses..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {options.roles.map((r: any) => <SelectItem key={r.id} value={r.id} className="rounded-lg">{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Divisi</Label>
                <Select required value={form.divisionId} onValueChange={v => setForm({...form, divisionId: v || ''})}>
                  <SelectTrigger className="rounded-xl overflow-hidden">
                    <SelectValue placeholder="Pilih divisi..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {options.divisions.map((d: any) => <SelectItem key={d.id} value={d.id} className="rounded-lg">{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Cabang</Label>
                <Select value={form.branchId} onValueChange={v => setForm({...form, branchId: v || 'none'})}>
                  <SelectTrigger className="rounded-xl overflow-hidden">
                    <SelectValue placeholder="Pilih cabang..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Tidak ada cabang</SelectItem>
                    {(options.branches || []).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Shift Kerja</Label>
                <Select value={form.shiftId} onValueChange={v => setForm({...form, shiftId: v || 'none'})}>
                  <SelectTrigger className="rounded-xl overflow-hidden">
                    <SelectValue placeholder="Pilih shift..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Belum ditentukan</SelectItem>
                    {(options.shifts || []).map((shift: any) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Kuota Cuti</Label>
                <Input type="number" min="0" value={form.totalQuota} onChange={e => setForm({...form, totalQuota: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Atasan Langsung</Label>
              <Select value={form.supervisorId} onValueChange={v => setForm({...form, supervisorId: v || 'none'})}>
                <SelectTrigger className="rounded-xl overflow-hidden">
                  <SelectValue placeholder="Pilih atasan..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">Tidak ada atasan</SelectItem>
                  {options.supervisors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.role?.name || s.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 flex gap-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)} className="flex-1 rounded-xl">Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordTarget} onOpenChange={(open) => {
        if (!open) {
          setPasswordTarget(null);
          setNewPassword('');
        }
      }}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold">Ubah Password</DialogTitle>
            <DialogDescription>
              Set password baru untuk {passwordTarget?.name || 'karyawan'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordUpdate} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground font-medium">Password Baru</Label>
              <Input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="rounded-xl"
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <div className="flex gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setPasswordTarget(null)} className="flex-1 rounded-xl">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {canCreateDivision && (
        <Card className="border-border shadow-md rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Building2 className="w-5 h-5 text-primary" />
              Setup Divisi
            </CardTitle>
            <CardDescription>Owner, CEO, GM, dan Admin dapat menambahkan divisi baru.</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <form onSubmit={handleCreateDivision} className="flex flex-col sm:flex-row gap-3">
              <Input
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                placeholder="Contoh: MARKETING"
                className="flex-1 rounded-xl"
              />
              <Button type="submit" size="sm" disabled={creatingDivision} className="h-9 px-4 rounded-xl">
                <Plus className="w-4 h-4" />
                {creatingDivision ? 'Menyimpan...' : 'Tambah Divisi'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canManageBranches && (
        <Card className="border-border shadow-md rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Clock3 className="w-5 h-5 text-primary" />
              Setup Shift
            </CardTitle>
            <CardDescription>CEO dapat mengatur jam shift Pagi, Middle, dan Malam.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {(options.shifts || []).map((shift: any) => (
                <div key={shift.id} className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="font-semibold text-foreground">{shift.name}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={shiftForms[shift.id]?.startTime || shift.startTime}
                      onChange={(event) => setShiftForms({
                        ...shiftForms,
                        [shift.id]: { ...(shiftForms[shift.id] || shift), startTime: event.target.value }
                      })}
                      className="rounded-xl"
                    />
                    <Input
                      type="time"
                      value={shiftForms[shift.id]?.endTime || shift.endTime}
                      onChange={(event) => setShiftForms({
                        ...shiftForms,
                        [shift.id]: { ...(shiftForms[shift.id] || shift), endTime: event.target.value }
                      })}
                      className="rounded-xl"
                    />
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleShiftUpdate(shift)} disabled={isSubmitting} className="mt-3 w-full rounded-xl">
                    Simpan Jam Shift
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-md rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Building2 className="w-5 h-5 text-primary" />
            Manajemen Cabang
          </CardTitle>
          <CardDescription>Kelola cabang yang digunakan untuk penempatan karyawan dan laporan toko.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {canManageBranches && (
            <form onSubmit={handleSaveBranch} className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_auto] gap-3">
              <Input
                value={branchForm.code}
                onChange={(event) => setBranchForm({ ...branchForm, code: event.target.value })}
                placeholder="Kode"
                className="rounded-xl"
              />
              <Input
                value={branchForm.name}
                onChange={(event) => setBranchForm({ ...branchForm, name: event.target.value })}
                placeholder="Nama cabang"
                className="rounded-xl"
              />
              <Input
                value={branchForm.address}
                onChange={(event) => setBranchForm({ ...branchForm, address: event.target.value })}
                placeholder="Alamat cabang"
                className="rounded-xl"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={savingBranch} className="h-9 rounded-xl px-4">
                  {savingBranch ? 'Menyimpan...' : editingBranchId ? 'Update' : 'Tambah'}
                </Button>
                {editingBranchId && (
                  <Button type="button" size="sm" variant="outline" onClick={resetBranchForm} className="h-9 rounded-xl px-4">
                    Batal
                  </Button>
                )}
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kode</th>
                  <th className="px-4 py-3 font-semibold">Nama Cabang</th>
                  <th className="px-4 py-3 font-semibold">Alamat</th>
                  <th className="px-4 py-3 font-semibold text-center">Karyawan</th>
                  {canManageBranches && <th className="px-4 py-3 font-semibold text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {(options.branches || []).length === 0 ? (
                  <tr>
                    <td colSpan={canManageBranches ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">
                      Belum ada cabang
                    </td>
                  </tr>
                ) : (
                  (options.branches || []).map((branch: any) => {
                    const employeeCount = users.filter((user) => user.branch?.id === branch.id || user.branchId === branch.id).length;
                    return (
                      <tr key={branch.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-semibold text-foreground">{branch.code}</td>
                        <td className="px-4 py-3">{branch.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{branch.address || '-'}</td>
                        <td className="px-4 py-3 text-center">{employeeCount}</td>
                        {canManageBranches && (
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => startEditBranch(branch)}>
                                <Pencil className="w-4 h-4" />
                                Edit
                              </Button>
                              <Button type="button" size="sm" variant="destructive" className="h-8 rounded-lg" onClick={() => handleDeleteBranch(branch)}>
                                <Trash2 className="w-4 h-4" />
                                Hapus
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {canManageAnnouncements && (
        <Card className="border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
              <Megaphone className="w-5 h-5 text-primary" />
              Pengumuman Global
            </CardTitle>
            <CardDescription>Buat pengumuman custom yang muncul sebagai popup di semua akun karyawan.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateAnnouncement} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Judul Pengumuman</Label>
                  <Input
                    value={announcementForm.title}
                    onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })}
                    placeholder="Contoh: Briefing Operasional Besok"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Kadaluarsa</Label>
                  <Input
                    type="date"
                    value={announcementForm.expiresAt}
                    onChange={(event) => setAnnouncementForm({ ...announcementForm, expiresAt: event.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Isi Pengumuman</Label>
                <Textarea
                  value={announcementForm.message}
                  onChange={(event) => setAnnouncementForm({ ...announcementForm, message: event.target.value })}
                  className="min-h-[110px] rounded-xl"
                  placeholder="Tulis pengumuman untuk semua karyawan..."
                />
              </div>
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Lampiran</p>
                  <p className="text-xs text-muted-foreground">{announcementForm.fileName || 'Belum ada lampiran'}</p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  {isUploadingAnnouncement ? 'Mengupload...' : 'Upload File'}
                  <input type="file" className="hidden" onChange={handleAnnouncementUpload} disabled={isUploadingAnnouncement} />
                </label>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || isUploadingAnnouncement} className="rounded-xl">
                  <Megaphone className="w-4 h-4" />
                  Kirim Pengumuman
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {canManageAnnouncements && (
        <Card className="border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl text-foreground">Tema Event</CardTitle>
            <CardDescription>Aktifkan suasana visual event untuk semua akun, misalnya Idul Fitri.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveEventTheme} className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                <input
                  id="event-theme-enabled"
                  type="checkbox"
                  checked={eventThemeForm.enabled}
                  onChange={(event) => setEventThemeForm({ ...eventThemeForm, enabled: event.target.checked })}
                />
                <Label htmlFor="event-theme-enabled">Aktif</Label>
              </div>
              <Input
                value={eventThemeForm.name}
                onChange={(event) => setEventThemeForm({ ...eventThemeForm, name: event.target.value })}
                placeholder="Nama event"
                className="rounded-xl"
              />
              <Select value={eventThemeForm.theme} onValueChange={(value) => setEventThemeForm({ ...eventThemeForm, theme: value || 'default' })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="fitri">Idul Fitri</SelectItem>
                  <SelectItem value="year-end">Akhir Tahun</SelectItem>
                  <SelectItem value="independence">Kemerdekaan</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                Simpan Tema
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="text-xl text-foreground">Pengajuan Resign</CardTitle>
          <CardDescription>Data resign otomatis menyimpan backup snapshot saat karyawan mengajukan.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold">Karyawan</th>
                  <th className="px-6 py-3 font-semibold">Cabang</th>
                  <th className="px-6 py-3 font-semibold">Tanggal Efektif</th>
                  <th className="px-6 py-3 font-semibold">Alasan</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  {canEditDeleteUsers && <th className="px-6 py-3 font-semibold text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {resignations.length === 0 ? (
                  <tr><td colSpan={canEditDeleteUsers ? 6 : 5} className="px-6 py-10 text-center text-muted-foreground">Belum ada pengajuan resign</td></tr>
                ) : resignations.map((request) => (
                  <tr key={request.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{request.user.name}</p>
                      <p className="text-xs text-muted-foreground">{request.user.role.name} - {request.user.division.name}</p>
                    </td>
                    <td className="px-6 py-4">{request.user.branch?.name || '-'}</td>
                    <td className="px-6 py-4">{new Date(request.effectiveDate).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 max-w-md truncate">{request.reason}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{request.status}</Badge>
                    </td>
                    {canEditDeleteUsers && (
                      <td className="px-6 py-4">
                        <div className="flex min-w-[420px] flex-col items-end gap-2">
                          <Input
                            value={resignationMessages[request.id] || ''}
                            onChange={(event) => setResignationMessages((current) => ({ ...current, [request.id]: event.target.value }))}
                            placeholder="Direct message ke staff"
                            className="h-9 rounded-lg text-xs"
                          />
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" className="h-8 rounded-lg" onClick={() => handleResignationAction(request, 'APPROVED')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => handleResignationAction(request, 'PENDING')}>
                              Pending
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => handleResignationAction(request, 'REJECTED')}>
                              Reject
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => handleResignationAction(request, request.status || 'PENDING')}>
                              <MessageSquare className="w-4 h-4" />
                              DM
                            </Button>
                            {request.user.isActive ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 rounded-lg"
                                onClick={() => handleResignationAction(request, 'APPROVED', true)}
                              >
                                <Trash2 className="w-4 h-4" /> Hapus Akun
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Akun nonaktif</span>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
              <Users className="w-5 h-5 text-primary" /> 
              Daftar Karyawan Aktif & Nonaktif
            </CardTitle>
            <CardDescription className="mt-1 text-sm">Menampilkan {users.length} data karyawan terdaftar di sistem.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input placeholder="Cari nama/email..." className="pl-9 w-64 rounded-xl" />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl"><Filter className="w-4 h-4 text-muted-foreground" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30/80 /80 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Karyawan</th>
                  <th className="px-6 py-4 font-semibold">Peran & Divisi</th>
                  <th className="px-6 py-4 font-semibold">Cabang</th>
                  <th className="px-6 py-4 font-semibold">Shift</th>
                  <th className="px-6 py-4 font-semibold">Atasan Langsung</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white  shadow-sm">
                          <AvatarFallback className="bg-card border border-border text-primary dark:from-indigo-900 dark:to-indigo-800 dark:text-primary font-semibold">
                            {u.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className="bg-muted/50 text-primary border-primary/30 dark:bg-primary/10 dark:text-primary dark:border-primary/20 rounded-md px-2 py-0.5">
                          {u.role.name}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground">{u.division.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-foreground">{u.branch?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {u.shift ? (
                        <span className="text-sm font-medium text-foreground">{u.shift.name} ({u.shift.startTime} - {u.shift.endTime})</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.supervisor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
                            {u.supervisor.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground dark:text-muted-foreground">{u.supervisor.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canEditDeleteUsers && (
                          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEditDialog(u)}>
                            <Pencil className="w-4 h-4 mr-1.5" /> Edit
                          </Button>
                        )}
                        {canEditDeleteUsers && (
                          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setPasswordTarget(u)}>
                            <KeyRound className="w-4 h-4 mr-1.5" /> Password
                          </Button>
                        )}
                        {canEditDeleteUsers && (
                          <Button
                            size="sm"
                            variant={u.isActive ? "destructive" : "default"}
                            className={u.isActive ? "rounded-lg shadow-sm" : "rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700"}
                            onClick={() => handleToggleActive(u.id, u.isActive)}
                          >
                            {u.isActive ? (
                              <><Trash2 className="w-4 h-4 mr-1.5" /> Hapus</>
                            ) : (
                              <><UserCheck className="w-4 h-4 mr-1.5" /> Aktifkan</>
                            )}
                          </Button>
                        )}
                        {!canEditDeleteUsers && (
                          <span className="text-xs text-muted-foreground">CEO only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
