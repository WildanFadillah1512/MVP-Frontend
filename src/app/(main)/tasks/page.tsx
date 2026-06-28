"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/lib/api/axios';
import { CheckCircle2, Clock, Loader2, Plus, Target, XCircle, User2, Calendar } from "lucide-react";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  TODO:        { label: 'Belum Mulai', color: 'text-slate-600',   bg: 'bg-slate-100',   icon: Clock },
  IN_PROGRESS: { label: 'Dikerjakan', color: 'text-indigo-700',  bg: 'bg-indigo-100',  icon: Loader2 },
  REVIEW:      { label: 'Review',     color: 'text-amber-700',   bg: 'bg-amber-100',   icon: Target },
  COMPLETED:   { label: 'Selesai',    color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  CANCELLED:   { label: 'Dibatalkan', color: 'text-rose-600',    bg: 'bg-rose-100',    icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Rendah',    color: 'text-slate-500' },
  MEDIUM: { label: 'Sedang',   color: 'text-amber-600' },
  HIGH:   { label: 'Tinggi',   color: 'text-orange-600' },
  URGENT: { label: 'Mendesak', color: 'text-rose-600' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const [form, setForm] = useState({
    title: '', description: '', assignedTo: '', priority: 'MEDIUM', dueDate: ''
  });

  const canAssign = ['OWNER', 'CEO', 'ADMIN', 'GM', 'MANAGER'].includes(userRole);

  const fetchData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.get('/tasks'),
        canAssign ? api.get('/tasks/users') : Promise.resolve({ data: { data: [] } })
      ]);
      if (tasksRes.data.success) setTasks(tasksRes.data.data);
      if (usersRes.data?.success) setAllUsers(usersRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const p = JSON.parse(userStr);
      setUserRole(p.role.name);
      setUserId(p.id);
    }
  }, []);

  useEffect(() => {
    if (userRole) fetchData();
  }, [userRole]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assignedTo) { toast.error('Judul dan penerima wajib diisi'); return; }
    setIsSubmitting(true);
    try {
      const res = await api.post('/tasks', form);
      if (res.data.success) {
        toast.success('Tugas berhasil dibuat');
        setForm({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });
        fetchData();
      }
    } catch { toast.error('Gagal membuat tugas'); }
    finally { setIsSubmitting(false); }
  };

  const updateStatus = async (taskId: string, status: string) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      toast.success('Status tugas diperbarui');
      fetchData();
    } catch { toast.error('Gagal memperbarui status'); }
  };

  const filtered = activeFilter === 'all' ? tasks : tasks.filter(t => t.status === activeFilter);
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Manajemen Tugas</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Assign, monitor, dan update status pekerjaan antar divisi.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Tugas', value: stats.total, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Belum Mulai', value: stats.todo, color: 'from-slate-500 to-slate-600' },
          { label: 'Dikerjakan', value: stats.inProgress, color: 'from-amber-500 to-orange-500' },
          { label: 'Selesai', value: stats.completed, color: 'from-emerald-500 to-teal-600' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-lg`}>
            <p className="text-white/80 text-sm font-medium">{s.label}</p>
            <p className="text-4xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Create Task - Only for managers and above */}
        {canAssign && (
          <Card className="lg:col-span-2 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-primary" /> Buat Tugas Baru
              </CardTitle>
              <CardDescription>Tugaskan pekerjaan ke karyawan</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300">Judul Tugas <span className="text-rose-500">*</span></Label>
                  <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Misal: Buat laporan produksi Juni" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300">Deskripsi</Label>
                  <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detail pekerjaan..." className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300">Tugaskan Ke <span className="text-rose-500">*</span></Label>
                  <Select value={form.assignedTo} onValueChange={v => setForm({...form, assignedTo: v || ''})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih karyawan..." /></SelectTrigger>
                    <SelectContent>
                      {allUsers.filter(u => u.id !== userId).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.role?.name} · {u.division?.name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Prioritas</Label>
                    <Select value={form.priority} onValueChange={v => setForm({...form, priority: v || 'MEDIUM'})}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">🟢 Rendah</SelectItem>
                        <SelectItem value="MEDIUM">🟡 Sedang</SelectItem>
                        <SelectItem value="HIGH">🟠 Tinggi</SelectItem>
                        <SelectItem value="URGENT">🔴 Mendesak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Deadline</Label>
                    <Input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="rounded-xl" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors shadow-lg disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Buat Tugas'}
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Task List */}
        <Card className={`${canAssign ? 'lg:col-span-3' : 'lg:col-span-5'} glass-card border-0 shadow-md rounded-2xl overflow-hidden`}>
          <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Daftar Tugas</CardTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              {['all', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${activeFilter === f
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                  {f === 'all' ? 'Semua' : STATUS_CONFIG[f]?.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-500">Tidak ada tugas {activeFilter !== 'all' ? `berstatus "${STATUS_CONFIG[activeFilter]?.label}"` : ''}</p>
                </div>
              ) : filtered.map(task => {
                const sCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG['TODO'];
                const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['MEDIUM'];
                const StatusIcon = sCfg.icon;
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
                return (
                  <div key={task.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${sCfg.bg} ${sCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {sCfg.label}
                          </span>
                          <span className={`text-xs font-semibold ${pCfg.color}`}>● {pCfg.label}</span>
                          {isOverdue && <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">⚠ Terlambat</span>}
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><User2 className="w-3 h-3" /> {task.assignee?.name || '—'}</span>
                          {task.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: localeId })}</span>}
                          <span className="text-slate-300">dari: {task.assigner?.name || '—'}</span>
                        </div>
                      </div>
                      {/* Status Changer - own task or manager */}
                      {(task.assignedTo === userId || canAssign) && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <Select value={task.status} onValueChange={v => updateStatus(task.id, v)}>
                          <SelectTrigger className="w-36 h-8 text-xs rounded-lg border-slate-200 dark:border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TODO">Belum Mulai</SelectItem>
                            <SelectItem value="IN_PROGRESS">Mulai Kerjakan</SelectItem>
                            <SelectItem value="REVIEW">Minta Review</SelectItem>
                            <SelectItem value="COMPLETED">Tandai Selesai</SelectItem>
                            {canAssign && <SelectItem value="CANCELLED">Batalkan</SelectItem>}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

