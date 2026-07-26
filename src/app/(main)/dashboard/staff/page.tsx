"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, TrendingUp, FileText, Upload, Target, ClipboardList, CalendarClock } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';

export default function StaffDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    const fetchData = async () => {
      try {
        const res = await dashboardApi.getStaffData();
        if (res.success) setData(res.data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!data) return <div>Gagal memuat data.</div>;

  const attendance = data.attendance;
  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary text-secondary-foreground p-8 rounded-3xl shadow-xl shadow-secondary/10 relative overflow-hidden">
        {/* Decorative subtle background pattern */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10">
          <p className="text-secondary-foreground/80 text-sm font-semibold tracking-wide uppercase mb-1">Selamat datang kembali 👋</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{user?.name || 'Karyawan'}</h1>
          <p className="text-secondary-foreground/70 mt-2 font-medium">{user?.division?.name} · {user?.role?.name} <span className="mx-2 opacity-50">|</span> {format(new Date(), 'EEEE, dd MMM yyyy', { locale: localeId })}</p>
        </div>
        
        <div className={`relative z-10 px-6 py-4 rounded-2xl border  min-w-[200px] ${attendance ? 'bg-black/20 border-white/10' : 'bg-rose-500/20 border-rose-500/30'}`}>
          {attendance ? (
            <>
              <p className="text-xs font-semibold text-secondary-foreground/70 uppercase tracking-widest mb-1">Status Hari Ini</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-xl font-bold">{attendance.status === 'HADIR' ? 'Hadir' : attendance.status}</p>
              </div>
              <p className="text-sm font-mono text-secondary-foreground/80 mt-2 bg-black/20 inline-block px-2 py-1 rounded-md">
                In: {attendance.checkIn ? format(new Date(attendance.checkIn), 'HH:mm') : '--:--'}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-rose-200 uppercase tracking-widest mb-1">Status Hari Ini</p>
              <p className="text-xl font-bold text-rose-400 flex items-center gap-2">⚠ Belum Hadir</p>
              <p className="text-sm text-rose-200 mt-2">Segera lakukan check-in!</p>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Link href="/performance" className="outline-none">
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Aktif</span>
            </div>
            <p className="text-4xl font-black text-foreground">{data.activeTargets.length}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Target Berjalan</p>
          </CardContent>
        </Card>
        </Link>

        <Link href="/performance" className="outline-none">
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">KPI</span>
            </div>
            <p className="text-4xl font-black text-foreground">{data.kpi?.score ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Skor Performa</p>
          </CardContent>
        </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Tugas Aktif</h2>
                <p className="text-sm text-muted-foreground">Pekerjaan yang diset oleh atasan/CEO</p>
              </div>
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col gap-3">
              {(data.activeTasks || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Belum ada tugas aktif.</p>
              ) : (
                data.activeTasks.map((task: any) => (
                  <Link key={task.id} href="/tasks" className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{task.title}</p>
                        {task.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>}
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {task.scheduleType === 'DAILY' ? 'Harian' : task.scheduleType === 'MONTHLY' ? 'Bulanan' : 'Sekali'}
                      </span>
                    </div>
                    {task.dueDate && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarClock className="w-3.5 h-3.5" /> Deadline {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: localeId })}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Target Kerja</h2>
                <p className="text-sm text-muted-foreground">Item pekerjaan yang ditetapkan untuk Anda</p>
              </div>
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col gap-3">
              {(data.activeTargets || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Belum ada target aktif.</p>
              ) : (
                data.activeTargets.slice(0, 5).map((item: any) => {
                  const percent = Math.min(100, Math.round((item.currentValue / Math.max(1, item.target.targetValue)) * 100));
                  return (
                    <Link key={item.id} href="/performance" className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-foreground">{item.target.title}</p>
                        <span className="text-sm font-black text-primary">{percent}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{item.currentValue} / {item.target.targetValue} {item.target.unit}</p>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4 px-1">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { label: 'Absensi', href: '/attendance', icon: CheckCircle },
            { label: 'Laporan', href: '/daily-reports', icon: FileText },
            { label: 'Upload', href: '/daily-uploads', icon: Upload },
            { label: 'Target KPI', href: '/performance', icon: Target },
            { label: 'Chat', href: '/chat', icon: TrendingUp },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="group outline-none">
              <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-card border border-border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/40 focus:ring-2 focus:ring-primary/50 text-center h-full">
                <div className="w-12 h-12 rounded-full bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
