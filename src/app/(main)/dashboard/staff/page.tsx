"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Calendar, TrendingUp, FileText, Upload, Target } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';

export default function StaffDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );
  if (!data) return <div>Gagal memuat data.</div>;

  const attendance = data.attendance;
  const balance = data.leaveBalance;
  const remainingLeave = balance ? balance.totalQuota - balance.usedQuota : 0;
  const usedLeave = balance?.usedQuota || 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-indigo-500 to-violet-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
        <div>
          <p className="text-indigo-200 text-sm font-medium">Selamat datang kembali 👋</p>
          <h1 className="text-3xl font-bold mt-1">{user?.name || 'Karyawan'}</h1>
          <p className="text-indigo-200 mt-1">{user?.division?.name} · {user?.role?.name} · {format(new Date(), 'EEEE, dd MMM yyyy', { locale: localeId })}</p>
        </div>
        <div className={`px-5 py-3 rounded-xl text-center ${attendance ? 'bg-white/20' : 'bg-rose-500/80'}`}>
          {attendance ? (
            <>
              <p className="text-xs font-medium text-indigo-100">Status Hari Ini</p>
              <p className="text-xl font-bold mt-0.5">{attendance.status === 'HADIR' ? '✓ Hadir' : attendance.status}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Masuk: {attendance.checkIn ? format(new Date(attendance.checkIn), 'HH:mm') : '--:--'}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-white/80">Status Hari Ini</p>
              <p className="text-xl font-bold mt-0.5">⚠ Belum Hadir</p>
              <p className="text-xs text-white/70 mt-0.5">Segera check-in!</p>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md glass-card rounded-2xl overflow-hidden">
          <CardContent className="pt-6 pb-5 px-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full">Aktif</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{data.activeTargets.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Target Berjalan</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md glass-card rounded-2xl overflow-hidden">
          <CardContent className="pt-6 pb-5 px-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">Sisa</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{remainingLeave}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hari Cuti Tersisa</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md glass-card rounded-2xl overflow-hidden">
          <CardContent className="pt-6 pb-5 px-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-0.5 rounded-full">Dipakai</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{usedLeave}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hari Cuti Terpakai</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md glass-card rounded-2xl overflow-hidden">
          <CardContent className="pt-6 pb-5 px-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400 px-2 py-0.5 rounded-full">KPI</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">N/A</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Skor Performa</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Absensi', href: '/attendance', icon: CheckCircle, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-900/50' },
            { label: 'Laporan Harian', href: '/daily-reports', icon: FileText, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/50' },
            { label: 'Upload Harian', href: '/daily-uploads', icon: Upload, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', hover: 'hover:bg-violet-200 dark:hover:bg-violet-900/50' },
            { label: 'Cuti', href: '/leave', icon: Calendar, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', hover: 'hover:bg-amber-200 dark:hover:bg-amber-900/50' },
            { label: 'Target & KPI', href: '/performance', icon: Target, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', hover: 'hover:bg-rose-200 dark:hover:bg-rose-900/50' },
            { label: 'Chat Divisi', href: '/chat', icon: TrendingUp, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', hover: 'hover:bg-cyan-200 dark:hover:bg-cyan-900/50' },
          ].map(({ label, href, icon: Icon, color, hover }) => (
            <Link key={href} href={href}>
              <div className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl ${color} ${hover} transition-colors cursor-pointer text-center`}>
                <Icon className="w-6 h-6" />
                <span className="text-sm font-semibold">{label}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}