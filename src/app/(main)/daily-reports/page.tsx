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
import { FileText, Send, Lock, CheckCircle2, ClipboardList } from 'lucide-react';

export default function DailyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayReport, setTodayReport] = useState<any>(null);

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
    } catch (error) { console.error('Error fetching reports:', error); }
  };

  useEffect(() => { fetchReports(); }, []);

  const onSubmit = async (data: ReportInput) => {
    setIsLoading(true);
    try {
      const response = await reportApi.create(data);
      if (response.success) {
        toast.success(todayReport ? 'Laporan berhasil diperbarui' : 'Laporan berhasil dikirim');
        fetchReports();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan laporan');
    } finally { setIsLoading(false); }
  };

  const isLocked = todayReport?.status === 'LOCKED';
  const isSubmitted = !!todayReport && !isLocked;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Laporan Harian</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Isi laporan pekerjaan harian sebelum terkunci otomatis dalam 24 jam.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form Card */}
        <Card className={`lg:col-span-2 glass-card border-0 shadow-md rounded-2xl overflow-hidden ${isLocked ? 'ring-2 ring-rose-300 dark:ring-rose-800' : ''}`}>
          <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Laporan Hari Ini</CardTitle>
                <CardDescription>{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}</CardDescription>
              </div>
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50">
                  <Lock className="w-3 h-3" /> Terkunci
                </span>
              ) : isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" /> Terkirim
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  Draft
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLocked ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Laporan Telah Terkunci</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                    Waktu pengisian laporan sudah melewati batas 24 jam. Hubungi Manager atau Admin untuk membuka kunci.
                  </p>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 dark:text-slate-300 font-medium">Deskripsi Pekerjaan <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="Jelaskan apa yang Anda kerjakan hari ini..." className="min-h-[100px] resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="output" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 dark:text-slate-300 font-medium">Output / Hasil <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Selesaikan 5 modul, 10 desain UI" {...field} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="obstacles" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 dark:text-slate-300 font-medium">Kendala <span className="text-slate-400 font-normal text-xs">(Opsional)</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="Apakah ada hambatan saat bekerja?" className="resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 dark:text-slate-300 font-medium">Catatan Tambahan <span className="text-slate-400 font-normal text-xs">(Opsional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Catatan untuk atasan..." {...field} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-lg shadow-brand-primary/20 h-11" disabled={isLoading}>
                    <Send className="w-4 h-4 mr-2" />
                    {isLoading ? 'Menyimpan...' : isSubmitted ? 'Perbarui Laporan' : 'Kirim Laporan'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* History Card */}
        <Card className="lg:col-span-3 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand-primary" /> Riwayat Laporan
            </CardTitle>
            <CardDescription>30 hari terakhir · {reports.length} laporan</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Belum ada riwayat laporan</p>
                  <p className="text-sm text-slate-400 mt-1">Mulai isi laporan harian Anda hari ini</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="flex gap-4 px-6 py-4 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="mt-1 shrink-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        report.status === 'LOCKED'
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                          : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {report.status === 'LOCKED' ? <Lock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {format(new Date(report.date), 'EEEE, dd MMM yyyy', { locale: id })}
                        </p>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          report.status === 'LOCKED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                        }`}>
                          {report.status === 'LOCKED' ? 'Terkunci' : 'Terkirim'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{report.description}</p>
                      {report.output && (
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
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
    </div>
  );
}