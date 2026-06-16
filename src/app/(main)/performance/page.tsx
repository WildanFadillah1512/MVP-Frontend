"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { targetApi } from '@/features/targets/api/target.api';
import { api } from '@/lib/api/axios';
import { Target, TrendingUp, CheckCircle, Clock, Plus, Users } from "lucide-react";
import { toast } from 'sonner';

export default function PerformancePage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    assigneeId: '',
    title: '',
    description: '',
    targetValue: '',
    unit: '',
    period: 'MONTHLY',
  });

  const fetchData = async (role: string) => {
    try {
      let res;
      if (['CEO', 'MANAGER', 'LEADER', 'ADMIN'].includes(role)) {
        res = await targetApi.getTeamTargets();
      } else {
        res = await targetApi.getMyTargets();
      }
      if (res.success) setTargets(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) setTeamMembers(res.data.data.filter((u: any) => u.isActive));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUserRole(parsed.role.name);
      fetchData(parsed.role.name);
    }
  }, []);

  const handleOpenCreate = () => {
    fetchTeamMembers();
    setShowCreateModal(true);
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assigneeId || !form.title || !form.targetValue || !form.unit) {
      toast.error('Harap lengkapi semua field yang wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await targetApi.createTarget({
        ...form,
        targetValue: Number(form.targetValue),
      });
      if (res.success) {
        toast.success('Target berhasil dibuat');
        setShowCreateModal(false);
        setForm({ assigneeId: '', title: '', description: '', targetValue: '', unit: '', period: 'MONTHLY' });
        fetchData(userRole);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat target');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async (id: string, currentVal: number, targetVal: number) => {
    const input = prompt(`Update progress (saat ini: ${currentVal} / ${targetVal}). Masukkan nilai baru:`);
    if (!input) return;
    const newVal = parseInt(input);
    if (isNaN(newVal) || newVal < 0) { toast.error('Nilai tidak valid'); return; }
    try {
      const res = await targetApi.updateProgress(id, newVal);
      if (res.success) { toast.success('Progress diperbarui'); fetchData(userRole); }
    } catch { toast.error('Gagal update progress'); }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  const isSupervisor = ['CEO', 'ADMIN', 'MANAGER', 'LEADER'].includes(userRole);
  const completedCount = targets.filter(t => t.isCompleted).length;
  const ongoingCount = targets.filter(t => !t.isCompleted).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Target & KPI</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isSupervisor ? 'Monitor & kelola target pekerjaan tim Anda.' : 'Lihat target pekerjaan yang ditugaskan kepada Anda.'}
          </p>
        </div>
        {isSupervisor && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
          >
            <Plus className="w-4 h-4" /> Buat Target Baru
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total Target {isSupervisor ? 'Tim' : 'Saya'}</p>
              <p className="text-4xl font-bold mt-1">{targets.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Sudah Selesai</p>
              <p className="text-4xl font-bold mt-1">{completedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Sedang Berjalan</p>
              <p className="text-4xl font-bold mt-1">{ongoingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Target List */}
      <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Daftar Target {isSupervisor ? 'Tim' : 'Saya'}
          </CardTitle>
          <CardDescription>Progress aktual dari setiap target yang telah ditetapkan</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Belum ada target yang ditetapkan</p>
              {isSupervisor && <p className="text-sm text-slate-400 mt-1">Klik "Buat Target Baru" untuk mulai</p>}
            </div>
          ) : (
            targets.map((item) => {
              const percentage = Math.min(100, Math.round((item.currentValue / item.target.targetValue) * 100));
              return (
                <div key={item.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">{item.target.title}</h4>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.isCompleted
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {item.isCompleted ? '✓ Selesai' : item.target.period}
                        </span>
                      </div>
                      {isSupervisor && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Users className="w-3.5 h-3.5 text-brand-primary" />
                          <span className="text-sm font-medium text-brand-primary">{item.user.name}</span>
                          <span className="text-xs text-slate-400">· {item.user.division?.name}</span>
                        </div>
                      )}
                      {item.target.description && (
                        <p className="text-sm text-slate-500 mt-1">{item.target.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">
                        Progress: <strong className="text-slate-800 dark:text-slate-200">{item.currentValue}</strong> / {item.target.targetValue} {item.target.unit}
                      </span>
                      <span className={`text-sm font-bold ${percentage >= 100 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.isCompleted ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {!isSupervisor && !item.isCompleted && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleUpdateProgress(item.id, item.currentValue, item.target.targetValue)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-sm font-medium transition-colors"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Update Progress
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Modal Buat Target */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-2xl font-bold">Buat Target Baru</DialogTitle>
            <DialogDescription>Tetapkan target KPI untuk anggota tim Anda.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTarget} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="font-medium text-slate-600 dark:text-slate-300">Assignee (Karyawan) <span className="text-rose-500">*</span></Label>
              <Select value={form.assigneeId} onValueChange={v => setForm({...form, assigneeId: v})}>
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <SelectValue placeholder="Pilih karyawan..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} — {m.division?.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-slate-600 dark:text-slate-300">Judul Target <span className="text-rose-500">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Contoh: Produksi 500 unit roti bulan ini"
                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-slate-600 dark:text-slate-300">Deskripsi <span className="text-slate-400 font-normal text-xs">(Opsional)</span></Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Detail target atau instruksi..."
                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label className="font-medium text-slate-600 dark:text-slate-300">Target Angka <span className="text-rose-500">*</span></Label>
                <Input
                  type="number" min="1"
                  value={form.targetValue}
                  onChange={e => setForm({...form, targetValue: e.target.value})}
                  placeholder="500"
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-slate-600 dark:text-slate-300">Satuan <span className="text-rose-500">*</span></Label>
                <Input
                  value={form.unit}
                  onChange={e => setForm({...form, unit: e.target.value})}
                  placeholder="unit"
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-slate-600 dark:text-slate-300">Periode</Label>
              <Select value={form.period} onValueChange={v => setForm({...form, period: v})}>
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Harian</SelectItem>
                  <SelectItem value="WEEKLY">Mingguan</SelectItem>
                  <SelectItem value="MONTHLY">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="w-full rounded-xl">Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20">
                {isSubmitting ? 'Menyimpan...' : 'Buat Target'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}