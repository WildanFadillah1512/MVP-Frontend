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
      default: return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50">
          <Hourglass className="w-3 h-3" /> Menunggu
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Manajemen Cuti</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Ajukan cuti, pantau saldo, dan setujui permintaan tim Anda.</p>
      </div>

      {/* Quota Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total Kuota Tahunan</p>
              <p className="text-4xl font-bold mt-1">{totalQuota} <span className="text-xl font-normal text-indigo-200">hari</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Sudah Digunakan</p>
              <p className="text-4xl font-bold mt-1">{usedQuota} <span className="text-xl font-normal text-rose-200">hari</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <PlaneTakeoff className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 bg-white/20 rounded-full h-1.5">
            <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="text-xs text-rose-200 mt-1">{usagePercent}% dari kuota</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Sisa Cuti Tersedia</p>
              <p className="text-4xl font-bold mt-1">{remainingQuota} <span className="text-xl font-normal text-emerald-200">hari</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my">
        <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="my" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5 py-2">Cuti Saya</TabsTrigger>
          {canApprove && <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5 py-2">Approval Tim</TabsTrigger>}
        </TabsList>

        <TabsContent value="my" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Form */}
            <Card className="lg:col-span-2 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Ajukan Cuti Baru</CardTitle>
                <CardDescription>Isi formulir berikut untuk mengajukan izin cuti.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 dark:text-slate-300 font-medium">Tanggal Mulai</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 dark:text-slate-300 font-medium">Tanggal Akhir</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="reason" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 dark:text-slate-300 font-medium">Alasan Cuti</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Jelaskan alasan pengajuan cuti Anda..." {...field} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {remainingQuota <= 0 && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-sm text-rose-700 dark:text-rose-400">
                        Kuota cuti Anda sudah habis.
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-lg shadow-brand-primary/20 h-11"
                      disabled={isLoading || remainingQuota <= 0}
                    >
                      {isLoading ? 'Memproses...' : 'Kirim Pengajuan Cuti'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* My History */}
            <Card className="lg:col-span-3 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Riwayat Pengajuan Saya</CardTitle>
                <CardDescription>{data.requests.length} pengajuan tercatat</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {data.requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <PlaneTakeoff className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Belum ada pengajuan cuti</p>
                      <p className="text-sm text-slate-400 mt-1">Isi formulir di sebelah untuk mengajukan cuti</p>
                    </div>
                  ) : (
                    data.requests.map(req => (
                      <div key={req.id} className="flex justify-between items-start px-6 py-4 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {format(new Date(req.startDate), 'dd MMM')} – {format(new Date(req.endDate), 'dd MMM yyyy')}
                            </span>
                            <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                              {differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1} hari
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 max-w-xs">{req.reason}</p>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {canApprove && (
          <TabsContent value="team" className="mt-6">
            <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-primary" /> Approval Cuti Tim
                  </CardTitle>
                  <CardDescription>Setujui atau tolak permintaan cuti anggota tim Anda.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50 rounded-full px-3 py-1 text-sm self-start md:self-auto">
                  {teamLeaves.filter(r => r.status === 'PENDING').length} Menunggu Review
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {teamLeaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Tidak ada pengajuan cuti tim</p>
                      <p className="text-sm text-slate-400 mt-1">Semua pengajuan sudah diproses</p>
                    </div>
                  ) : (
                    teamLeaves.map(req => (
                      <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{req.user?.name || 'Unknown'}</span>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 rounded-md text-xs px-1.5">
                              {req.user?.division?.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {format(new Date(req.startDate), 'dd MMM')} – {format(new Date(req.endDate), 'dd MMM yyyy')}
                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                              {differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1} hari
                            </span>
                          </p>
                          <p className="text-sm text-slate-500 mt-1 max-w-sm">{req.reason}</p>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          {getStatusBadge(req.status)}
                          {req.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 rounded-lg" onClick={() => handleApproval(req.id, 'REJECTED')}>
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                              </Button>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm" onClick={() => handleApproval(req.id, 'APPROVED')}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
