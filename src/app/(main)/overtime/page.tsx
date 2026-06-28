"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from '@/lib/api/axios';
import { toast } from 'sonner';
import { Timer, Plus, ArrowLeft, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OvertimePage() {
  const router = useRouter();
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [allOvertimes, setAllOvertimes] = useState<any[]>([]);
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [overtimeForm, setOvertimeForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', reason: '', notes: '' });
  const [submittingOT, setSubmittingOT] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const EXECUTIVE_ROLES = ['OWNER', 'CEO', 'GM', 'ADMIN', 'MANAGER'];

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      if (EXECUTIVE_ROLES.includes(user.role?.name)) {
        api.get('/overtime/all')
          .then(r => { if (r.data.success) setAllOvertimes(r.data.data); })
          .catch(() => {});
      }
    }
    api.get('/overtime/me').then(r => { if (r.data.success) setOvertimes(r.data.data); }).catch(() => {});
  }, []);

  const handleOvertimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOT(true);
    try {
      const payload = {
        ...overtimeForm,
        startTime: `${overtimeForm.date}T${overtimeForm.startTime}:00`,
        endTime: `${overtimeForm.date}T${overtimeForm.endTime}:00`
      };
      const res = await api.post('/overtime', payload);
      if (res.data.success) {
        toast.success('Pengajuan lembur berhasil dikirim');
        setShowOvertimeForm(false);
        setOvertimeForm({ date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', reason: '', notes: '' });
        const r = await api.get('/overtime/me');
        if (r.data.success) setOvertimes(r.data.data);
      }
    } catch { toast.error('Gagal mengajukan lembur'); }
    finally { setSubmittingOT(false); }
  };

  const handleOvertimeApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.patch(`/overtime/${id}/status`, { status });
      if (res.data.success) {
        toast.success(`Lembur berhasil di-${status === 'APPROVED' ? 'setujui' : 'tolak'}`);
        const r = await api.get('/overtime/all');
        if (r.data.success) setAllOvertimes(r.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses lembur');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-border bg-card shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Kelola Lembur</h1>
            <p className="text-muted-foreground mt-1">Ajukan jam lembur tambahan dan pantau status persetujuannya.</p>
          </div>
        </div>
        <Button onClick={() => setShowOvertimeForm(!showOvertimeForm)} className="rounded-xl h-11 px-6 shadow-sm font-semibold transition-all hover:scale-[1.02] bg-primary text-primary-foreground hover:bg-primary/90">
          {showOvertimeForm ? 'Batal Pengajuan' : <><Plus className="w-4 h-4" /> Ajukan Lembur Baru</>}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Kolom Kiri: Form & Riwayat Pribadi */}
        <div className={`space-y-8 ${currentUser && EXECUTIVE_ROLES.includes(currentUser.role?.name) ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {showOvertimeForm && (
            <Card className="border-border shadow-md rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4">
              <CardHeader className="bg-card border-b border-border/50 px-6 py-5">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" /> Formulir Pengajuan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleOvertimeSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Tanggal Lembur</Label>
                    <Input type="date" required value={overtimeForm.date} onChange={e => setOvertimeForm({...overtimeForm, date: e.target.value})} className="rounded-xl bg-muted/20 h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Jam Mulai <span className="text-rose-500">*</span></Label>
                      <Input type="time" required value={overtimeForm.startTime} onChange={e => setOvertimeForm({...overtimeForm, startTime: e.target.value})} className="rounded-xl bg-muted/20 h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Jam Selesai <span className="text-rose-500">*</span></Label>
                      <Input type="time" required value={overtimeForm.endTime} onChange={e => setOvertimeForm({...overtimeForm, endTime: e.target.value})} className="rounded-xl bg-muted/20 h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Alasan Lembur <span className="text-rose-500">*</span></Label>
                    <Input required value={overtimeForm.reason} onChange={e => setOvertimeForm({...overtimeForm, reason: e.target.value})} placeholder="Misal: Mengejar target produksi akhir bulan" className="rounded-xl bg-muted/20 h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Catatan Tambahan</Label>
                    <Input value={overtimeForm.notes} onChange={e => setOvertimeForm({...overtimeForm, notes: e.target.value})} placeholder="Opsional" className="rounded-xl bg-muted/20 h-11" />
                  </div>
                  <Button type="submit" disabled={submittingOT} className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20 hover:bg-primary/90">
                    {submittingOT ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="border-border shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-card border-b border-border/50 px-6 py-5">
              <CardTitle className="text-lg font-bold text-foreground">Riwayat Pengajuan Saya</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {overtimes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Timer className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">Belum ada pengajuan lembur</p>
                  </div>
                ) : overtimes.map(ot => (
                  <div key={ot.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-foreground">{ot.reason}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(ot.date), 'dd MMM yyyy', { locale: id })}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {ot.totalHours.toFixed(1)} jam</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        ot.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        ot.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-accent/20 text-accent-foreground border-accent/30'
                      }`}>
                        {ot.status === 'APPROVED' ? 'Disetujui' : ot.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Approval untuk Atasan */}
        {currentUser && EXECUTIVE_ROLES.includes(currentUser.role?.name) && (
          <div className="lg:col-span-7">
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden h-full flex flex-col">
              <CardHeader className="bg-card border-b border-border/50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">Persetujuan Lembur Tim</CardTitle>
                    <CardDescription>Daftar pengajuan lembur yang perlu ditinjau</CardDescription>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                    {allOvertimes.filter(ot => ot.status === 'PENDING').length} Menunggu
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="divide-y divide-border/50">
                  {allOvertimes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                      <CheckCircle className="w-16 h-16 text-emerald-500/30 mb-4" />
                      <p className="text-lg font-semibold text-foreground">Semua Beres!</p>
                      <p className="text-muted-foreground">Tidak ada pengajuan lembur yang perlu diproses.</p>
                    </div>
                  ) : allOvertimes.map((ot) => (
                    <div key={ot.id} className="p-6 flex flex-col gap-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                            {ot.user?.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-base">{ot.user?.name}</p>
                            <p className="text-sm text-muted-foreground">{ot.user?.role?.name} - {ot.user?.division?.name}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          ot.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          ot.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-accent/20 text-accent-foreground border-accent/30'
                        }`}>
                          {ot.status}
                        </span>
                      </div>
                      
                      <div className="bg-card border border-border/50 rounded-xl p-4">
                        <p className="text-sm font-medium text-foreground mb-3">{ot.reason}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(ot.date), 'dd MMM yyyy')}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {ot.totalHours.toFixed(1)} jam</span>
                        </div>
                      </div>

                      {ot.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-3 mt-2">
                          <Button variant="outline" className="h-10 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleOvertimeApproval(ot.id, 'REJECTED')}>
                            <XCircle className="w-4 h-4 mr-1.5" /> Tolak
                          </Button>
                          <Button className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" onClick={() => handleOvertimeApproval(ot.id, 'APPROVED')}>
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Setujui
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
