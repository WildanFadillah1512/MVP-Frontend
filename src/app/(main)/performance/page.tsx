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
    const userStr = sessionStorage.getItem('user');
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const isSupervisor = ['CEO', 'ADMIN', 'MANAGER', 'LEADER'].includes(userRole);
  const completedCount = targets.filter(t => t.isCompleted).length;
  const ongoingCount = targets.filter(t => !t.isCompleted).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Target &amp; KPI</h1>
          <p className="text-muted-foreground mt-1">
            {isSupervisor ? 'Monitor & kelola target pekerjaan tim Anda.' : 'Lihat target pekerjaan yang ditugaskan kepada Anda.'}
          </p>
        </div>
        {isSupervisor && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" /> Buat Target Baru
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Total Target {isSupervisor ? 'Tim' : 'Saya'}</p>
            <p className="text-4xl font-black text-foreground mt-0.5">{targets.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Sudah Selesai</p>
            <p className="text-4xl font-black text-emerald-600 mt-0.5">{completedCount}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Sedang Berjalan</p>
            <p className="text-4xl font-black text-amber-600 mt-0.5">{ongoingCount}</p>
          </div>
        </div>
      </div>

      {/* Target List */}
      <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border p-6">
          <CardTitle className="text-xl font-bold text-foreground">
            Daftar Target {isSupervisor ? 'Tim' : 'Saya'}
          </CardTitle>
          <CardDescription>Progress aktual dari setiap target yang telah ditetapkan</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-foreground font-medium">Belum ada target yang ditetapkan</p>
              {isSupervisor && <p className="text-sm text-muted-foreground mt-1">Klik "Buat Target Baru" untuk mulai</p>}
            </div>
          ) : (
            targets.map((item) => {
              const percentage = Math.min(100, Math.round((item.currentValue / item.target.targetValue) * 100));
              return (
                <div key={item.id} className="border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-lg text-foreground">{item.target.title}</h4>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.isCompleted ? '✓ Selesai' : item.target.period}
                        </span>
                      </div>
                      {isSupervisor && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm font-medium text-primary">{item.user.name}</span>
                          <span className="text-xs text-muted-foreground">· {item.user.division?.name}</span>
                        </div>
                      )}
                      {item.target.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.target.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Progress: <strong className="text-foreground">{item.currentValue}</strong> / {item.target.targetValue} {item.target.unit}
                      </span>
                      <span className={`text-sm font-bold ${percentage >= 100 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="bg-muted rounded-full h-2.5 overflow-hidden">
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-sm font-medium transition-colors"
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
        <DialogContent className="max-w-lg rounded-2xl border-border shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border">
            <DialogTitle className="text-2xl font-bold text-foreground">Buat Target Baru</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">Tetapkan target KPI untuk anggota tim Anda.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTarget} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="font-semibold text-foreground text-sm">Assignee (Karyawan) <span className="text-rose-500">*</span></Label>
              <Select value={form.assigneeId} onValueChange={v => setForm({...form, assigneeId: v ?? ''})}>
                <SelectTrigger className="rounded-xl border-border bg-muted/30 h-11">
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
              <Label className="font-semibold text-foreground text-sm">Judul Target <span className="text-rose-500">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Contoh: Produksi 500 unit roti bulan ini"
                className="rounded-xl border-border bg-muted/30 h-11 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-foreground text-sm">Deskripsi <span className="text-muted-foreground font-normal text-xs">(Opsional)</span></Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Detail target atau instruksi..."
                className="rounded-xl border-border bg-muted/30 focus-visible:ring-primary resize-none min-h-[90px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground text-sm">Target Angka <span className="text-rose-500">*</span></Label>
                <Input
                  type="number" min="1"
                  value={form.targetValue}
                  onChange={e => setForm({...form, targetValue: e.target.value})}
                  placeholder="500"
                  className="rounded-xl border-border bg-muted/30 h-11 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-foreground text-sm">Satuan <span className="text-rose-500">*</span></Label>
                <Input
                  value={form.unit}
                  onChange={e => setForm({...form, unit: e.target.value})}
                  placeholder="unit"
                  className="rounded-xl border-border bg-muted/30 h-11 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-foreground text-sm">Periode</Label>
              <Select value={form.period} onValueChange={v => setForm({...form, period: v ?? 'MONTHLY'})}>
                <SelectTrigger className="rounded-xl border-border bg-muted/30 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Harian</SelectItem>
                  <SelectItem value="WEEKLY">Mingguan</SelectItem>
                  <SelectItem value="MONTHLY">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl h-11">Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                {isSubmitting ? 'Menyimpan...' : 'Buat Target'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
