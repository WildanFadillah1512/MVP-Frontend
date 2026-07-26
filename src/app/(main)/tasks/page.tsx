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
  TODO:        { label: 'Belum Mulai', color: 'text-muted-foreground',   bg: 'bg-muted',   icon: Clock },
  IN_PROGRESS: { label: 'Dikerjakan', color: 'text-primary',  bg: 'bg-primary/10',  icon: Loader2 },
  REVIEW:      { label: 'Review',     color: 'text-amber-700',   bg: 'bg-amber-100',   icon: Target },
  COMPLETED:   { label: 'Selesai',    color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  CANCELLED:   { label: 'Dibatalkan', color: 'text-rose-600',    bg: 'bg-rose-100',    icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Rendah',    color: 'text-muted-foreground' },
  MEDIUM: { label: 'Sedang',   color: 'text-amber-600' },
  HIGH:   { label: 'Tinggi',   color: 'text-orange-600' },
  URGENT: { label: 'Mendesak', color: 'text-rose-600' },
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  TODO: 'Belum Mulai',
  IN_PROGRESS: 'Mulai Kerjakan',
  REVIEW: 'Minta Review',
  COMPLETED: 'Tandai Selesai',
  CANCELLED: 'Batalkan',
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
    title: '', description: '', assignedTo: '', priority: 'MEDIUM', scheduleType: 'ONE_TIME', scheduleDate: '', dueDate: ''
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
        setForm({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', scheduleType: 'ONE_TIME', scheduleDate: '', dueDate: '' });
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary text-secondary-foreground p-8 rounded-3xl shadow-xl shadow-secondary/10 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Manajemen Tugas</h1>
          <p className="text-secondary-foreground/70 mt-2 font-medium">Assign, monitor, dan update status pekerjaan antar divisi.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        {[
          { label: 'Total Tugas', value: stats.total, color: 'bg-primary text-primary-foreground shadow-primary/20' },
          { label: 'Belum Mulai', value: stats.todo, color: 'bg-card text-foreground border border-border shadow-sm' },
          { label: 'Dikerjakan', value: stats.inProgress, color: 'bg-accent text-accent-foreground shadow-accent/20' },
          { label: 'Selesai', value: stats.completed, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-sm' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-6 shadow-lg overflow-hidden relative`}>
            <p className="text-sm font-semibold opacity-80 mb-2">{s.label}</p>
            <p className="text-4xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Create Task - Only for managers and above */}
        {canAssign && (
          <Card className="lg:col-span-2 border-border shadow-md rounded-2xl overflow-hidden self-start">
            <CardHeader className="bg-card border-b border-border/50 px-6 py-5">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                Buat Tugas Baru
              </CardTitle>
              <CardDescription>Delegasikan pekerjaan ke anggota tim</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-muted/10">
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">Judul Tugas <span className="text-rose-500">*</span></Label>
                  <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Misal: Buat laporan produksi Juni" className="rounded-xl bg-card h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">Deskripsi</Label>
                  <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detail pekerjaan..." className="rounded-xl bg-card h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">Tugaskan Ke <span className="text-rose-500">*</span></Label>
                  <Select value={form.assignedTo} onValueChange={v => setForm({...form, assignedTo: v || ''})}>
                    <SelectTrigger className="rounded-xl bg-card h-11 overflow-hidden">
                      <SelectValue placeholder="Pilih karyawan...">
                        {form.assignedTo ? allUsers.find(u => u.id === form.assignedTo)?.name : "Pilih karyawan..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.filter(u => u.id !== userId).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.role?.name} · {u.division?.name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Prioritas</Label>
                    <Select value={form.priority} onValueChange={v => setForm({...form, priority: v || 'MEDIUM'})}>
                      <SelectTrigger className="rounded-xl bg-card h-11 overflow-hidden">
                        <SelectValue>
                          {{LOW: 'Rendah', MEDIUM: 'Sedang', HIGH: 'Tinggi', URGENT: 'Mendesak'}[form.priority] || 'Sedang'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Rendah</SelectItem>
                        <SelectItem value="MEDIUM">Sedang</SelectItem>
                        <SelectItem value="HIGH">Tinggi</SelectItem>
                        <SelectItem value="URGENT">Mendesak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Deadline</Label>
                    <Input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="rounded-xl bg-card h-11" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Setup Tugas</Label>
                    <Select value={form.scheduleType} onValueChange={v => setForm({...form, scheduleType: v || 'ONE_TIME', scheduleDate: v === 'ONE_TIME' ? '' : form.scheduleDate})}>
                      <SelectTrigger className="rounded-xl bg-card h-11 overflow-hidden">
                        <SelectValue>
                          {{ONE_TIME: 'Sekali', DAILY: 'Harian', MONTHLY: 'Bulanan'}[form.scheduleType] || 'Sekali'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONE_TIME">Sekali</SelectItem>
                        <SelectItem value="DAILY">Harian</SelectItem>
                        <SelectItem value="MONTHLY">Bulanan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">{form.scheduleType === 'MONTHLY' ? 'Bulan Tugas' : 'Tanggal Tugas'}</Label>
                    <Input
                      type={form.scheduleType === 'MONTHLY' ? 'month' : 'date'}
                      value={form.scheduleDate}
                      onChange={e => setForm({...form, scheduleDate: e.target.value})}
                      disabled={form.scheduleType === 'ONE_TIME'}
                      required={form.scheduleType !== 'ONE_TIME'}
                      className="rounded-xl bg-card h-11"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors shadow-md disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Buat Tugas'}
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Task List */}
        <Card className={`${canAssign ? 'lg:col-span-3' : 'lg:col-span-5'} border-border shadow-sm rounded-2xl overflow-hidden h-full flex flex-col`}>
          <CardHeader className="bg-card border-b border-border/50 px-6 py-5">
            <CardTitle className="text-xl font-bold text-foreground">Daftar Tugas</CardTitle>
            <div className="flex flex-wrap gap-2 mt-4">
              {['all', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${activeFilter === f
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted/50'}`}>
                  {f === 'all' ? 'Semua' : STATUS_CONFIG[f]?.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">Tidak Ada Tugas</p>
                  <p className="text-muted-foreground mt-1">Daftar tugas {activeFilter !== 'all' ? `berstatus "${STATUS_CONFIG[activeFilter]?.label}" ` : ''}masih kosong.</p>
                </div>
              ) : filtered.map(task => {
                const sCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG['TODO'];
                const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['MEDIUM'];
                const StatusIcon = sCfg.icon;
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
                return (
                  <div key={task.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${sCfg.bg} ${sCfg.color} border border-current/10`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {sCfg.label}
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md bg-muted/50 ${pCfg.color}`}>Prio: {pCfg.label}</span>
                          {isOverdue && <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full">⚠ Terlambat</span>}
                        </div>
                        <p className="font-bold text-foreground text-lg">{task.title}</p>
                        {task.description && <p className="text-sm font-medium text-muted-foreground mt-1.5">{task.description}</p>}
                        
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/30 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                            <User2 className="w-3.5 h-3.5" /> Ditugaskan ke: <strong className="text-foreground">{task.assignee?.name || '—'}</strong>
                          </span>
                          {task.dueDate && <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: localeId })}
                          </span>}
                          <span>Dari: {task.assigner?.name || '—'}</span>
                          {task.scheduleType && task.scheduleType !== 'ONE_TIME' && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {task.scheduleType === 'DAILY' ? 'Harian' : 'Bulanan'}
                              {task.scheduleDate ? `: ${format(new Date(task.scheduleDate), task.scheduleType === 'MONTHLY' ? 'MMM yyyy' : 'dd MMM yyyy', { locale: localeId })}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Changer - own task or manager */}
                      {(task.assignedTo === userId || canAssign) && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <div className="shrink-0 mt-2 sm:mt-0">
                          <Select value={task.status} onValueChange={v => updateStatus(task.id, v)}>
                            <SelectTrigger className="w-full sm:w-40 h-10 text-xs font-bold rounded-xl border-border bg-card shadow-sm hover:border-primary/50 transition-colors overflow-hidden">
                              <SelectValue>
                                {STATUS_ACTION_LABELS[String(task.status)] || 'Status'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TODO">Belum Mulai</SelectItem>
                              <SelectItem value="IN_PROGRESS">Mulai Kerjakan</SelectItem>
                              <SelectItem value="REVIEW">Minta Review</SelectItem>
                              <SelectItem value="COMPLETED">Tandai Selesai</SelectItem>
                              {canAssign && <SelectItem value="CANCELLED">Batalkan</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
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

