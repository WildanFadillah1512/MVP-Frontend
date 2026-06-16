"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { attendanceApi } from '@/features/attendance/api/attendance.api';
import { toast } from 'sonner';
import { Clock, CheckCircle, LogOut, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendances = async () => {
    try {
      const response = await attendanceApi.getMyAttendance();
      if (response.success) {
        setAttendances(response.data);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayData = response.data.find((a: any) =>
          format(new Date(a.date), 'yyyy-MM-dd') === todayStr
        );
        setTodayAttendance(todayData);
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
    }
  };

  useEffect(() => { fetchAttendances(); }, []);

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      const res = await attendanceApi.checkIn();
      if (res.success) { toast.success('Check-in berhasil!'); fetchAttendances(); }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal check-in');
    } finally { setIsLoading(false); }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      const res = await attendanceApi.checkOut();
      if (res.success) { toast.success('Check-out berhasil!'); fetchAttendances(); }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal check-out');
    } finally { setIsLoading(false); }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    HADIR: { label: 'Hadir', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    TELAT: { label: 'Terlambat', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    ALFA: { label: 'Tidak Hadir', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  };

  const hadirCount = attendances.filter(a => a.status === 'HADIR').length;
  const telatCount = attendances.filter(a => a.status === 'TELAT').length;

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Absensi Harian</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Catat jam masuk dan pulang kerja Anda setiap hari.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total Hari Tercatat</p>
              <p className="text-4xl font-bold mt-1">{attendances.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Hari Hadir Tepat Waktu</p>
              <p className="text-4xl font-bold mt-1">{hadirCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Hari Terlambat</p>
              <p className="text-4xl font-bold mt-1">{telatCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Clock-in Card */}
        <Card className="lg:col-span-2 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Status Hari Ini</CardTitle>
            <CardDescription>{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Live Clock */}
            <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 dark:text-indigo-500 mb-2">Waktu Sekarang</p>
              <div className="text-6xl font-bold font-mono tracking-tighter text-slate-800 dark:text-white">
                {format(time, 'HH:mm:ss')}
              </div>
              <p className="text-sm text-slate-400 mt-2">{format(time, 'dd MMM yyyy')}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!todayAttendance ? (
                <Button
                  size="lg"
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-lg shadow-brand-primary/20 h-12 text-base"
                  onClick={handleCheckIn}
                  disabled={isLoading}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {isLoading ? 'Memproses...' : 'Check In Sekarang'}
                </Button>
              ) : !todayAttendance.checkOut ? (
                <>
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">✓ Check-in Berhasil</p>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {format(new Date(todayAttendance.checkIn), 'HH:mm')}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-xl h-12 text-base"
                    onClick={handleCheckOut}
                    disabled={isLoading}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    {isLoading ? 'Memproses...' : 'Check Out'}
                  </Button>
                </>
              ) : (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Check-in</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{format(new Date(todayAttendance.checkIn), 'HH:mm:ss')}</p>
                    </div>
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Check-out</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{format(new Date(todayAttendance.checkOut), 'HH:mm:ss')}</p>
                    </div>
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 -mx-1">
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Total Jam Kerja</p>
                    <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{todayAttendance.totalHours} Jam</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History Card */}
        <Card className="lg:col-span-3 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Riwayat Absensi</CardTitle>
            <CardDescription>30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {attendances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Belum ada riwayat absensi</p>
                  <p className="text-sm text-slate-400 mt-1">Mulai dengan check-in hari ini</p>
                </div>
              ) : (
                attendances.map((record) => {
                  const cfg = statusConfig[record.status] || { label: record.status, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
                  return (
                    <div key={record.id} className="flex items-center justify-between px-6 py-4 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {format(new Date(record.date), 'EEEE, dd MMM yyyy', { locale: id })}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '--:--'}
                            {' → '}
                            {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '--:--'}
                            {record.totalHours ? ` · ${record.totalHours} jam` : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}