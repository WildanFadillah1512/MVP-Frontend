"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reportApi, reportSchema, ReportInput } from '@/features/reports/api/report.api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileText, Send, Lock, CheckCircle2, ClipboardList, Unlock } from 'lucide-react';

export default function DailyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [lockedReports, setLockedReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayReport, setTodayReport] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [targetsList, setTargetsList] = useState<any[]>([]);
  const [selectedWorkItem, setSelectedWorkItem] = useState<string>('');
  const [workQuantity, setWorkQuantity] = useState<string>('');

  const form = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: { description: '', output: '', obstacles: '', notes: '' },
  });

  const fetchReports = async () => {
    try {
      const response = await reportApi.getMyReports();
      if (response.success) {
        setReports(response.data);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayData = response.data.find((r: any) =>
          format(new Date(r.date), 'yyyy-MM-dd') === todayStr
        );
        setTodayReport(todayData);
        if (todayData) {
          form.reset({
            description: todayData.description,
            output: todayData.output || '',
            obstacles: todayData.obstacles || '',
            notes: todayData.notes || '',
          });
        }
      }
      if (['OWNER', 'CEO', 'GM', 'ADMIN', 'MANAGER', 'LEADER'].includes(userRole)) {
        const lockedRes = await reportApi.getLockedReports().catch(() => ({ success: false, data: [] }));
        if (lockedRes.success) setLockedReports(lockedRes.data || []);
      }

      // Fetch tasks for dropdown
      try {
        const { api } = await import('@/lib/api/axios');
        const [tasksRes, targetsRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/targets/me')
        ]);
        if (tasksRes.data.success) {
          // Only show pending or in progress tasks
          const activeTasks = tasksRes.data.data.filter((t: any) => t.status !== 'COMPLETED');
          setTasksList(activeTasks);
        }
        if (targetsRes.data.success) {
          setTargetsList((targetsRes.data.data || []).filter((item: any) => !item.isCompleted));
        }
      } catch (e) {
        console.error("Gagal mengambil daftar tugas", e);
      }
    } catch (error) { console.error('Error fetching reports:', error); }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const current = JSON.parse(userStr);
      setUserRole(current.role?.name || '');
    }
  }, []);

  useEffect(() => { fetchReports(); }, [userRole]);

  const onSubmit = async (data: ReportInput) => {
    setIsLoading(true);
    try {
      const payload = { ...data };
      if (selectedWorkItem) {
        const [type, id] = selectedWorkItem.split(':');
        payload.tasks = [{
          taskType: type,
          taskId: type === 'TASK' ? id : undefined,
          targetAssignmentId: type === 'TARGET' ? id : undefined,
          quantity: type === 'TARGET' && workQuantity ? Number(workQuantity) : undefined,
          notes: 'Dikerjakan via Laporan Harian'
        }];
      }

      const response = await reportApi.create(payload);
      if (response.success) {
        toast.success(todayReport ? 'Laporan berhasil diperbarui' : 'Laporan berhasil dikirim');
        fetchReports();
        setSelectedWorkItem('');
        setWorkQuantity('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan laporan');
    } finally { setIsLoading(false); }
  };

  const isLocked = todayReport?.status === 'LOCKED';
  const isSubmitted = !!todayReport && !isLocked;
  const canUnlock = ['OWNER', 'CEO', 'GM', 'ADMIN', 'MANAGER', 'LEADER'].includes(userRole);

  const handleUnlock = async (reportId: string) => {
    try {
      const response = await reportApi.unlockReport(reportId);
      if (response.success) {
        toast.success('Laporan berhasil dibuka');
        fetchReports();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuka laporan');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary text-secondary-foreground p-8 rounded-3xl shadow-xl shadow-secondary/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Laporan Harian</h1>
          <p className="text-secondary-foreground/70 mt-2 font-medium">Isi laporan pekerjaan sebelum terkunci otomatis dalam 24 jam.</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-white/10 border border-white/10 rounded-2xl px-6 py-4 ">
          <ClipboardList className="w-5 h-5 text-secondary-foreground/70 mr-1" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/50">Total Laporan</p>
            <p className="text-3xl font-black">{reports.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form Card */}
        <Card className={`lg:col-span-2 bg-card border-border shadow-sm rounded-2xl overflow-hidden ${isLocked ? 'ring-2 ring-rose-400 dark:ring-rose-700' : ''}`}>
          <CardHeader className="bg-secondary text-secondary-foreground px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Laporan Hari Ini</CardTitle>
                <CardDescription className="text-secondary-foreground/60">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}</CardDescription>
              </div>
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/30 text-white border border-rose-400/30">
                  <Lock className="w-3 h-3" /> Terkunci
                </span>
              ) : isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-white border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3" /> Terkirim
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-secondary-foreground border border-white/10">
                  Draft
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLocked ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-200 dark:border-rose-800/50">
                  <Lock className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-lg">Laporan Telah Terkunci</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                    Waktu pengisian sudah melewati batas 24 jam. Hubungi Manager atau Admin untuk membuka kunci.
                  </p>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-foreground">Deskripsi Pekerjaan <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="Jelaskan apa yang Anda kerjakan hari ini..." className="min-h-[100px] resize-none rounded-xl bg-muted/20 border-border focus-visible:ring-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="space-y-2">
                    <FormLabel className="font-bold text-foreground">Pekerjaan yang Dikerjakan (Opsional)</FormLabel>
                    <select 
                      className="flex h-11 w-full rounded-xl border border-input bg-muted/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedWorkItem}
                      onChange={(e) => setSelectedWorkItem(e.target.value)}
                    >
                      <option value="">-- Pilih Pekerjaan --</option>
                      {tasksList.length > 0 && <option disabled>-- Tugas --</option>}
                      {tasksList.map(task => (
                        <option key={task.id} value={`TASK:${task.id}`}>{task.title}</option>
                      ))}
                      {targetsList.length > 0 && <option disabled>-- Target --</option>}
                      {targetsList.map(item => (
                        <option key={item.id} value={`TARGET:${item.id}`}>{item.target.title} ({item.currentValue}/{item.target.targetValue} {item.target.unit})</option>
                      ))}
                    </select>
                    <p className="text-[0.8rem] text-muted-foreground">Tugas akan otomatis mulai dikerjakan, target akan menambah progres sesuai angka yang diisi.</p>
                  </div>

                  {selectedWorkItem.startsWith('TARGET:') && (
                    <div className="space-y-2">
                      <FormLabel className="font-bold text-foreground">Progress Target Hari Ini</FormLabel>
                      <Input
                        type="number" step="any"
                        min="0"
                        step="0.01"
                        value={workQuantity}
                        onChange={(event) => setWorkQuantity(event.target.value)}
                        placeholder="Masukkan angka progress"
                        className="h-11 rounded-xl bg-muted/20 border-border focus-visible:ring-primary"
                      />
                    </div>
                  )}

                  <FormField control={form.control} name="output" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-foreground">Output / Hasil <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Selesaikan 5 modul, 10 desain UI" {...field} className="h-11 rounded-xl bg-muted/20 border-border focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="obstacles" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-foreground">Kendala <span className="text-muted-foreground font-normal text-xs">(Opsional)</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="Apakah ada hambatan saat bekerja?" className="resize-none rounded-xl bg-muted/20 border-border focus-visible:ring-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-foreground">Catatan Tambahan <span className="text-muted-foreground font-normal text-xs">(Opsional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Catatan untuk atasan..." {...field} className="h-11 rounded-xl bg-muted/20 border-border focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full h-12 rounded-xl shadow-md font-bold transition-all hover:-translate-y-0.5" disabled={isLoading}>
                    <Send className="w-4 h-4" />
                    {isLoading ? 'Menyimpan...' : isSubmitted ? 'Perbarui Laporan' : 'Kirim Laporan'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* History Card — Timeline Style */}
        <Card className="lg:col-span-3 bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/10 px-6 py-5">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Riwayat Laporan
            </CardTitle>
            <CardDescription>30 hari terakhir · {reports.length} laporan</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="font-bold text-foreground">Belum ada riwayat laporan</p>
                  <p className="text-sm text-muted-foreground mt-1">Mulai isi laporan harian Anda hari ini</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="flex gap-4 px-6 py-5 hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        report.status === 'LOCKED'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                      }`}>
                        {report.status === 'LOCKED' ? <Lock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-foreground text-sm">
                          {format(new Date(report.date), 'EEEE, dd MMM yyyy', { locale: id })}
                        </p>
                        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          report.status === 'LOCKED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                        }`}>
                          {report.status === 'LOCKED' ? 'Terkunci' : 'Terkirim'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{report.description}</p>
                      {report.output && (
                        <p className="text-xs font-bold text-primary mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {report.output}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canUnlock && (
        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/10 px-6 py-5">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Unlock className="w-5 h-5 text-primary" /> Laporan Terkunci Tim
            </CardTitle>
            <CardDescription>{lockedReports.length} laporan menunggu pembukaan oleh atasan</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {lockedReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <p className="font-medium text-muted-foreground">Tidak ada laporan terkunci</p>
                </div>
              ) : lockedReports.map((report) => (
                <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-bold text-foreground">{report.user?.name}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {report.user?.role?.name} / {report.user?.division?.name} · {format(new Date(report.date), 'dd MMM yyyy', { locale: id })}
                    </p>
                  </div>
                  <Button size="sm" className="rounded-xl font-bold shadow-sm transition-all hover:-translate-y-0.5" onClick={() => handleUnlock(report.id)}>
                    <Unlock className="w-3.5 h-3.5 mr-1.5" /> Buka Laporan
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
