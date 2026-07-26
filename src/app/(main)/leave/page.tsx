"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leaveApi, leaveSchema, LeaveInput } from '@/features/leaves/api/leave.api';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Calendar, PlaneTakeoff, Hourglass, ShieldCheck } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function LeavePage() {
  const [data, setData] = useState<{ balance: any; requests: any[] }>({ balance: null, requests: [] });
  const [teamLeaves, setTeamLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState('');

  const form = useForm<LeaveInput>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { startDate: '', endDate: '', reason: '' }
  });

  const fetchData = async () => {
    try {
      const [myRes, teamRes] = await Promise.all([
        leaveApi.getMyLeaves(),
        leaveApi.getTeamLeaves().catch(() => ({ success: false, data: [] }))
      ]);
      if (myRes.success) setData(myRes.data);
      if (teamRes.success) setTeamLeaves(teamRes.data || []);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) { const parsed = JSON.parse(userStr); setUserRole(parsed.role.name); }
    fetchData();
  }, []);

  const onSubmit = async (formData: LeaveInput) => {
    setIsLoading(true);
    try {
      const res = await leaveApi.create(formData);
      if (res.success) { toast.success('Pengajuan cuti berhasil dikirim'); form.reset(); fetchData(); }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengajukan cuti');
    } finally { setIsLoading(false); }
  };

  const handleApproval = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await leaveApi.approveLeave(leaveId, status);
      if (res.success) { toast.success(`Cuti berhasil di-${status === 'APPROVED' ? 'setujui' : 'tolak'}`); fetchData(); }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses cuti');
    }
  };

  const handleCancellationApproval = async (cancellationId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await leaveApi.approveCancellation(cancellationId, status);
      if (res.success) {
        toast.success(`Pembatalan cuti berhasil di-${status === 'APPROVED' ? 'setujui' : 'tolak'}`);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses pembatalan cuti');
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pengajuan cuti ini?')) return;
    try {
      const res = await leaveApi.cancelLeave(leaveId);
      if (res.success) { toast.success('Cuti berhasil dibatalkan'); fetchData(); }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membatalkan cuti');
    }
  };

  const canApprove = ['CEO', 'ADMIN', 'MANAGER', 'LEADER'].includes(userRole);
  const balance = data.balance;
  const usedQuota = balance?.usedQuota || 0;
  const totalQuota = balance?.totalQuota || 0;
  const remainingQuota = totalQuota - usedQuota;
  const usagePercent = totalQuota > 0 ? Math.round((usedQuota / totalQuota) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50">
          <CheckCircle className="w-3 h-3" /> Disetujui
        </span>
      );
      case 'REJECTED': return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50">
          <XCircle className="w-3 h-3" /> Ditolak
        </span>
      );
      case 'CANCELLED': return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          <XCircle className="w-3 h-3" /> Dibatalkan
        </span>
      );
      default: return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50">
          <Hourglass className="w-3 h-3" /> Menunggu
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary text-secondary-foreground p-8 rounded-3xl shadow-xl shadow-secondary/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Manajemen Cuti</h1>
          <p className="text-secondary-foreground/70 mt-2 font-medium">Ajukan cuti, pantau saldo, dan setujui permintaan tim.</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-white/10 border border-white/10 rounded-2xl px-6 py-4  text-center">
          <PlaneTakeoff className="w-5 h-5 text-secondary-foreground/70" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/50">Sisa Kuota</p>
            <p className="text-3xl font-black">{remainingQuota} <span className="text-lg font-semibold text-secondary-foreground/70">hari</span></p>
          </div>
        </div>
      </div>

      {/* Quota stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-secondary/30 flex items-center justify-center text-secondary-foreground">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Kuota</span>
          </div>
          <p className="text-4xl font-black text-foreground">{totalQuota}</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Total Hari Tahunan</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <PlaneTakeoff className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Terpakai</span>
          </div>
          <p className="text-4xl font-black text-foreground">{usedQuota}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1.5">
              <span>Penggunaan</span>
              <span className="font-bold text-foreground">{usagePercent}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tersisa</span>
          </div>
          <p className="text-4xl font-black text-foreground">{remainingQuota}</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Hari Tersedia</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="flex flex-row items-center justify-center p-1.5 bg-secondary/20 border border-secondary/30 rounded-2xl w-max mx-auto">
            <TabsTrigger value="my" className="px-8 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:font-bold text-muted-foreground font-medium transition-all">
              Cuti Saya
            </TabsTrigger>
            {canApprove && (
              <TabsTrigger value="team" className="px-8 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:font-bold text-muted-foreground font-medium transition-all">
                Approval Tim
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="my" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Form */}
            <Card className="lg:col-span-4 bg-card border-border shadow-md rounded-3xl overflow-hidden h-fit">
              <CardHeader className="bg-secondary/30 text-foreground px-6 py-5 border-b border-border/50">
                <CardTitle className="text-lg font-bold">Ajukan Cuti Baru</CardTitle>
                <CardDescription className="text-muted-foreground">Isi formulir untuk mengajukan izin cuti.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground text-xs uppercase tracking-wider">Mulai</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="h-11 rounded-xl bg-muted/20 border-border focus-visible:ring-primary shadow-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground text-xs uppercase tracking-wider">Akhir</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="h-11 rounded-xl bg-muted/20 border-border focus-visible:ring-primary shadow-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="reason" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground text-xs uppercase tracking-wider">Alasan Cuti</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Jelaskan alasan pengajuan cuti Anda..." {...field} className="rounded-xl bg-muted/20 border-border focus-visible:ring-primary min-h-[120px] resize-none shadow-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {remainingQuota <= 0 && (
                      <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-sm text-rose-700 font-medium">
                        Kuota cuti Anda sudah habis untuk tahun ini.
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl shadow-md shadow-primary/20 font-bold transition-all hover:-translate-y-0.5 text-base"
                      disabled={isLoading || remainingQuota <= 0}
                    >
                      {isLoading ? 'Memproses...' : 'Kirim Pengajuan'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* My History */}
            <Card className="lg:col-span-8 bg-card border-border shadow-md rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-card px-8 py-6">
                <CardTitle className="text-xl font-bold text-foreground">Riwayat Pengajuan Saya</CardTitle>
                <CardDescription className="text-base">{data.requests.length} pengajuan tercatat di sistem</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {data.requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                        <PlaneTakeoff className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                      <p className="font-bold text-xl text-foreground">Belum ada riwayat cuti</p>
                      <p className="text-muted-foreground mt-2">Anda belum pernah mengajukan cuti.</p>
                    </div>
                  ) : (
                    data.requests.map(req => (
                      <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-8 py-6 hover:bg-muted/50 transition-colors gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-bold text-foreground text-lg">
                              {format(new Date(req.startDate), 'dd MMM yyyy')} <span className="text-muted-foreground font-normal mx-1">s/d</span> {format(new Date(req.endDate), 'dd MMM yyyy')}
                            </span>
                            <span className="text-xs bg-secondary/50 text-foreground px-3 py-1 rounded-full font-bold border border-border">
                              {differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1} Hari
                            </span>
                          </div>
                          <p className="text-foreground/80 leading-relaxed max-w-2xl">{req.reason}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {getStatusBadge(req.status)}
                          {req.cancellationRequests?.some((item: any) => item.status === 'PENDING') && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Hourglass className="w-3 h-3" /> Pembatalan menunggu approval
                            </span>
                          )}
                          {(req.status === 'PENDING' || req.status === 'APPROVED') && !req.cancellationRequests?.some((item: any) => item.status === 'PENDING') && (
                            <Button 
                              type="button"
                              variant="destructive" 
                              size="sm" 
                              className="h-8 text-xs font-bold rounded-lg px-3"
                              onClick={() => handleCancel(req.id)}
                            >
                              Batalkan
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {canApprove && (
          <TabsContent value="team" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-primary" /> Menunggu Persetujuan Tim
                </h3>
                <p className="text-muted-foreground mt-1">Review permintaan cuti dari anggota tim Anda dengan cepat.</p>
              </div>
              <div className="bg-amber-100 text-amber-800 border border-amber-200 px-5 py-2 text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                {teamLeaves.filter(r => r.status === 'PENDING').length} Perlu Review
              </div>
            </div>
            
            {teamLeaves.length === 0 ? (
              <Card className="bg-card border-dashed border-2 border-border shadow-none rounded-3xl py-20">
                <div className="flex flex-col items-center justify-center text-center px-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <p className="font-bold text-xl text-foreground">Semua Tuntas!</p>
                  <p className="text-muted-foreground mt-2">Tidak ada pengajuan cuti yang perlu di-review saat ini.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {teamLeaves.map(req => (
                  <Card key={req.id} className="rounded-3xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border/50 bg-secondary/10 flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm">
                          {req.user?.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-lg">{req.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{req.user?.division?.name}</p>
                        </div>
                      </div>
                      <div className="shrink-0">{getStatusBadge(req.status)}</div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-6 bg-muted/30 rounded-2xl p-4 border border-border/50">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Mulai Cuti</span>
                          <span className="font-black text-foreground">{format(new Date(req.startDate), 'dd MMM yyyy')}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center px-4 border-x border-border/50">
                           <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md">
                              {differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1}H
                           </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Berakhir</span>
                          <span className="font-black text-foreground">{format(new Date(req.endDate), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Alasan Pengajuan</p>
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{req.reason}</p>
                      </div>
                      {req.cancellationRequests?.length > 0 && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Pembatalan Cuti</p>
                          <p className="mt-1 text-sm text-amber-900">
                            {req.cancellationRequests[0].reason || 'Karyawan meminta pembatalan cuti.'}
                          </p>
                        </div>
                      )}
                    </div>
                    {req.status === 'PENDING' && (
                      <div className="p-5 bg-card border-t border-border/50 flex gap-3">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold shadow-sm" onClick={() => handleApproval(req.id, 'REJECTED')}>
                          Tolak
                        </Button>
                        <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md" onClick={() => handleApproval(req.id, 'APPROVED')}>
                          Setujui
                        </Button>
                      </div>
                    )}
                    {req.cancellationRequests?.length > 0 && req.cancellationRequests[0].status === 'PENDING' && (
                      <div className="p-5 bg-card border-t border-border/50 flex gap-3">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold shadow-sm" onClick={() => handleCancellationApproval(req.cancellationRequests[0].id, 'REJECTED')}>
                          Tolak Pembatalan
                        </Button>
                        <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md" onClick={() => handleCancellationApproval(req.cancellationRequests[0].id, 'APPROVED')}>
                          Setujui Pembatalan
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
