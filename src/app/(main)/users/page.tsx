"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { api } from '@/lib/api/axios';
import { Users, Plus, UserCheck, UserX, Search, Filter, Building2 } from "lucide-react";
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ roles: [], divisions: [], supervisors: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [divisionName, setDivisionName] = useState('');
  const [creatingDivision, setCreatingDivision] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', name: '', roleId: '', divisionId: '', supervisorId: '', totalQuota: '12'
  });

  const fetchData = async () => {
    try {
      const [usersRes, optRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/options')
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (optRes.data.success) setOptions(optRes.data.data);
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
        setForm({ email: '', password: '', name: '', roleId: '', divisionId: '', supervisorId: '', totalQuota: '12' });
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

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
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

  const canCreateDivision = ['OWNER', 'CEO', 'GM', 'ADMIN'].includes(userRole);

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
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih hak akses..." /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {options.roles.map((r: any) => <SelectItem key={r.id} value={r.id} className="rounded-lg">{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Penempatan Divisi</Label>
                    <Select required value={form.divisionId} onValueChange={v => setForm({...form, divisionId: v || ''})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih divisi..." /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {options.divisions.map((d: any) => <SelectItem key={d.id} value={d.id} className="rounded-lg">{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Lapor Kepada (Atasan Langsung)</Label>
                  <Select value={form.supervisorId} onValueChange={v => setForm({...form, supervisorId: v || ''})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Tidak wajib (Pilih atasan...)" /></SelectTrigger>
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
                      <Button
                        size="sm"
                        variant={u.isActive ? "destructive" : "default"}
                        className={u.isActive ? "rounded-lg shadow-sm" : "rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700"}
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                      >
                        {u.isActive ? (
                          <><UserX className="w-4 h-4 mr-1.5" /> Suspend</>
                        ) : (
                          <><UserCheck className="w-4 h-4 mr-1.5" /> Activate</>
                        )}
                      </Button>
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
