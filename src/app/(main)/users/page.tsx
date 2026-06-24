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
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Search, Filter } from "lucide-react";
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ roles: [], divisions: [], supervisors: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => { fetchData(); }, []);

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

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola akun karyawan, hak akses, dan divisi.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-lg shadow-brand-primary/20 px-6 h-9">
              <Plus className="w-5 h-5 mr-2" /> Tambah User
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <DialogTitle className="text-2xl font-bold">Tambah User Baru</DialogTitle>
              <DialogDescription>
                Isi data karyawan secara lengkap untuk membuat akun baru.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 dark:text-slate-300 font-medium">Nama Lengkap</Label>
                  <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" placeholder="Budi Santoso" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 dark:text-slate-300 font-medium">Email</Label>
                  <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" placeholder="budi@company.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 dark:text-slate-300 font-medium">Password Default</Label>
                  <Input type="password" required placeholder="Minimal 6 karakter" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 dark:text-slate-300 font-medium">Kuota Cuti Tahunan (Hari)</Label>
                  <Input type="number" min="0" value={form.totalQuota} onChange={e => setForm({...form, totalQuota: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                </div>
              </div>
              
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-300 font-medium">Role Sistem</Label>
                    <Select required value={form.roleId} onValueChange={v => setForm({...form, roleId: v || ''})}>
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"><SelectValue placeholder="Pilih hak akses..." /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {options.roles.map((r: any) => <SelectItem key={r.id} value={r.id} className="rounded-lg">{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-300 font-medium">Penempatan Divisi</Label>
                    <Select required value={form.divisionId} onValueChange={v => setForm({...form, divisionId: v || ''})}>
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"><SelectValue placeholder="Pilih divisi..." /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {options.divisions.map((d: any) => <SelectItem key={d.id} value={d.id} className="rounded-lg">{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 dark:text-slate-300 font-medium">Lapor Kepada (Atasan Langsung)</Label>
                  <Select value={form.supervisorId} onValueChange={v => setForm({...form, supervisorId: v || ''})}>
                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"><SelectValue placeholder="Tidak wajib (Pilih atasan...)" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Tidak ada atasan</SelectItem>
                      {options.supervisors.map((s: any) => <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name} <span className="text-slate-400">({s.role?.name || s.email})</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="w-full rounded-xl">Batal</Button>
                <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-lg shadow-brand-primary/20" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Karyawan Baru'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800 dark:text-slate-100">
              <Users className="w-5 h-5 text-brand-primary" /> 
              Daftar Karyawan Aktif & Nonaktif
            </CardTitle>
            <CardDescription className="mt-1 text-sm">Menampilkan {users.length} data karyawan terdaftar di sistem.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input placeholder="Cari nama/email..." className="pl-9 w-64 rounded-xl border-slate-200 bg-white dark:bg-slate-900" />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl border-slate-200 bg-white"><Filter className="w-4 h-4 text-slate-500" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800">
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
                  <tr key={u.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 dark:from-indigo-900 dark:to-indigo-800 dark:text-indigo-300 font-semibold">
                            {u.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50 rounded-md px-2 py-0.5">
                          {u.role.name}
                        </Badge>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{u.division.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.supervisor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {u.supervisor.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.supervisor.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">-</span>
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
