"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, CheckCircle, AlertCircle, ArrowUpRight, Target } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';

export default function LeaderDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getLeaderData();
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

  const reportRate = Math.round((data.reports.submittedToday / (data.team.total || 1)) * 100);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Leader Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau kehadiran, laporan, dan target harian tim Anda.</p>
        </div>
        <div className="px-4 py-2 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-lg font-medium text-sm flex items-center gap-2">
          <Target className="w-4 h-4" /> Team Leader
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg shadow-indigo-500/10 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-indigo-100 text-sm font-medium">Anggota Tim Aktif</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">
              {data.team.activeToday} <span className="text-xl text-indigo-200">/ {data.team.total}</span>
            </div>
            <div className="flex items-center text-xs text-indigo-100 bg-black/10 w-fit px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Hadir hari ini
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-violet-500/10 bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <FileText className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-violet-100 text-sm font-medium">Laporan Harian</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.reports.submittedToday}</div>
            <div className="flex items-center text-xs text-violet-100 bg-black/10 w-fit px-2 py-1 rounded-md">
              {reportRate}% dari tim hari ini
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-emerald-100 text-sm font-medium">Target Selesai</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">0%</div>
            <div className="flex items-center text-xs text-emerald-100 bg-black/10 w-fit px-2 py-1 rounded-md">
              Progress hari ini
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-rose-500/10 bg-gradient-to-br from-rose-500 to-red-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <AlertCircle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-rose-100 text-sm font-medium">Perlu Direview</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="flex items-center text-xs text-rose-100 bg-black/10 w-fit px-2 py-1 rounded-md">
              Upload bukti harian
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reports */}
      <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
            Anggota Belum Laporan
            <span className="text-xs font-normal px-3 py-1 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-full">
              {data.team.total - data.reports.submittedToday} Orang
            </span>
          </CardTitle>
          <CardDescription>Daftar anggota tim yang belum submit laporan hari ini</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.team.total === data.reports.submittedToday ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
              <p className="font-medium text-slate-600 dark:text-slate-300">Semua anggota sudah laporan hari ini! 🎉</p>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400">
              <p className="text-sm">Data detail belum tersedia. Cek halaman Laporan Harian.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}