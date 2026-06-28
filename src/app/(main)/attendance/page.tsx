"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { attendanceApi } from '@/features/attendance/api/attendance.api';
import { api } from '@/lib/api/axios';
import { toast } from 'sonner';
import { Clock, CheckCircle, LogOut, Calendar, TrendingUp, AlertCircle, Timer, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AttendancePage() {
  const router = useRouter();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [time, setTime] = useState<Date>(new Date());
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allAttendanceToday, setAllAttendanceToday] = useState<any[]>([]);

  const EXECUTIVE_ROLES = ['OWNER', 'CEO', 'GM', 'ADMIN', 'MANAGER'];

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

  useEffect(() => {
    // Ambil data user dari sessionStorage
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      // Jika atasan, ambil absensi semua karyawan hari ini
      if (EXECUTIVE_ROLES.includes(user.role?.name)) {
        api.get('/attendances/today/all')
          .then(r => { if (r.data.success) setAllAttendanceToday(r.data.data); })
          .catch(() => {});
      }
    }
    fetchAttendances();
  }, []);

  const handleCheckIn = async () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung deteksi lokasi (GPS)');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await attendanceApi.checkIn({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          if (res.success) { toast.success('Check-in berhasil!'); fetchAttendances(); }
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Gagal check-in');
        } finally { setIsLoading(false); }
      },
      (error) => {
        toast.error('Gagal mendapatkan lokasi. Harap izinkan akses lokasi (GPS) di browser Anda.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung deteksi lokasi (GPS)');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await attendanceApi.checkOut({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          if (res.success) { toast.success('Check-out berhasil!'); fetchAttendances(); }
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Gagal check-out');
        } finally { setIsLoading(false); }
      },
      (error) => {
        toast.error('Gagal mendapatkan lokasi. Harap izinkan akses lokasi (GPS) di browser Anda.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    HADIR: { label: 'Hadir', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    TELAT: { label: 'Terlambat', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    ALFA: { label: 'Tidak Hadir', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  };

  const hadirCount = attendances.filter(a => a.status === 'HADIR').length;
  const telatCount = attendances.filter(a => a.status === 'TELAT').length;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Absensi Harian</h1>
          <p className="text-muted-foreground mt-1">
            {currentUser ? (
              <span>Login sebagai: <strong className="text-foreground">{currentUser.name}</strong> — {currentUser.role?.name} / {currentUser.division?.name}</span>
            ) : 'Catat jam masuk dan pulang kerja Anda setiap hari.'}
          </p>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => router.push('/overtime')} className="rounded-xl h-11 px-6 shadow-sm font-semibold transition-all hover:scale-[1.02]">
              <Timer className="w-4 h-4" /> Kelola Lembur
            </Button>
        </div>
      </div>

      {/* Summary Stats - Clean card style */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-secondary/30 flex items-center justify-center text-secondary-foreground">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</span>
          </div>
          <p className="text-4xl font-black text-foreground">{attendances.length}</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Hari Tercatat</p>
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tepat Waktu</span>
          </div>
          <p className="text-4xl font-black text-foreground">{hadirCount}</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Hadir Tepat Waktu</p>
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Terlambat</span>
          </div>
          <p className="text-4xl font-black text-rose-600 dark:text-rose-400">{telatCount}</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Hari Terlambat</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Clock-in Card — Full Premium Layout */}
        <Card className="lg:col-span-1 border-border shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="bg-secondary text-secondary-foreground px-6 py-5">
            <CardTitle className="text-base font-bold">Status Hari Ini</CardTitle>
            <CardDescription className="text-secondary-foreground/60">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col gap-6">
            {/* Live Clock - Big centerpiece */}
            <div className="flex flex-col items-center justify-center text-center py-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Waktu Sekarang</p>
              <div className="text-6xl lg:text-7xl font-black font-mono tracking-tighter text-foreground tabular-nums leading-none">
                {format(time, 'HH:mm')}
              </div>
              <div className="text-2xl font-bold font-mono text-muted-foreground tabular-nums mt-1">
                {format(time, 'ss')}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-border/50 pt-6">
              {!todayAttendance ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-black rounded-2xl shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  onClick={handleCheckIn}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-5 w-5" />
                  {isLoading ? 'Memproses...' : 'Check In Sekarang'}
                </Button>
              ) : !todayAttendance.checkOut ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">✓ Check-in Berhasil</p>
                      <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums font-mono">
                        {format(new Date(todayAttendance.checkIn), 'HH:mm')}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-400 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-2xl h-14 text-base font-black transition-all hover:-translate-y-0.5"
                    onClick={handleCheckOut}
                    disabled={isLoading}
                  >
                    <LogOut className="h-5 w-5" />
                    {isLoading ? 'Memproses...' : 'Check Out'}
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl bg-card border border-border overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-border/50">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Check-in</p>
                      <p className="text-2xl font-black text-emerald-600 tabular-nums font-mono">{format(new Date(todayAttendance.checkIn), 'HH:mm:ss')}</p>
                    </div>
                    <Clock className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <div className="p-4 flex items-center justify-between border-b border-border/50">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Check-out</p>
                      <p className="text-2xl font-black text-rose-600 tabular-nums font-mono">{format(new Date(todayAttendance.checkOut), 'HH:mm:ss')}</p>
                    </div>
                    <Clock className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <div className="p-4 bg-secondary/30 flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">Total Jam Kerja</p>
                    <p className="text-xl font-black text-primary tabular-nums">{todayAttendance.totalHours} jam</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History Card */}
        <Card className="lg:col-span-2 border-border shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="bg-card border-b border-border/50 px-6 py-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Riwayat Kehadiran</CardTitle>
              <CardDescription>Bulan Ini</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border/50">
              {attendances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <Calendar className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg text-foreground font-semibold">Belum Ada Data</p>
                  <p className="text-muted-foreground mt-2 max-w-sm">Riwayat kehadiran Anda akan muncul di sini setelah melakukan check-in pertama.</p>
                </div>
              ) : (
                attendances.map((record) => {
                  const cfg = statusConfig[record.status] || { label: record.status, color: 'text-muted-foreground', bg: 'bg-muted border-border' };
                  return (
                    <div key={record.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-card border border-border flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-muted-foreground uppercase">{format(new Date(record.date), 'MMM')}</span>
                          <span className="text-lg font-bold text-foreground leading-none">{format(new Date(record.date), 'dd')}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {format(new Date(record.date), 'EEEE', { locale: id })}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span className="font-mono">{record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '--:--'}</span>
                            <span className="text-border">→</span>
                            <span className="font-mono">{record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '--:--'}</span>
                            {record.totalHours ? <span className="hidden sm:inline">({record.totalHours} jam)</span> : null}
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

      {/* Rekap Absensi Semua Karyawan Hari Ini — Hanya untuk Atasan */}
      {currentUser && EXECUTIVE_ROLES.includes(currentUser.role?.name) && allAttendanceToday.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Pemantauan Kehadiran Tim
            </h2>
            <span className="text-sm text-muted-foreground">{allAttendanceToday.length} karyawan hadir hari ini</span>
          </div>
          
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left py-3 px-5 text-muted-foreground font-semibold">Nama & Jabatan</th>
                    <th className="text-left py-3 px-5 text-muted-foreground font-semibold">Check-In</th>
                    <th className="text-left py-3 px-5 text-muted-foreground font-semibold">Check-Out</th>
                    <th className="text-left py-3 px-5 text-muted-foreground font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {allAttendanceToday.map((att: any) => (
                    <tr key={att.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-foreground">{att.user?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{att.user?.role?.name} · {att.user?.division?.name}</p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                          {att.checkIn ? format(new Date(att.checkIn), 'HH:mm') : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-md">
                          {att.checkOut ? format(new Date(att.checkOut), 'HH:mm') : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          att.status === 'HADIR' ? 'bg-emerald-100 text-emerald-700' :
                          att.status === 'TELAT' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>{att.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
