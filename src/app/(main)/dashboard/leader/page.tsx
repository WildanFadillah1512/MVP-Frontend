"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, CheckCircle, AlertCircle, ArrowUpRight, Target } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import Link from 'next/link';

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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!data) return <div>Gagal memuat data.</div>;

  const reportRate = Math.round((data.reports.submittedToday / (data.team.total || 1)) * 100);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leader Dashboard</h1>
          <p className="text-muted-foreground mt-1">Pantau kehadiran, laporan, dan target harian tim Anda.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary rounded-lg font-medium text-sm flex items-center gap-2">
          <Target className="w-4 h-4" /> Team Leader
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/users" className="outline-none">
        <Card className="border-0 shadow-sm bg-card border border-border text-foreground overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Anggota Tim Aktif</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">
              {data.team.activeToday} <span className="text-xl text-muted-foreground">/ {data.team.total}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground bg-black/10 w-fit px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Hadir hari ini
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/daily-reports" className="outline-none">
        <Card className="border-0 shadow-sm bg-card border border-border text-foreground overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <FileText className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Laporan Harian</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.reports.submittedToday}</div>
            <div className="flex items-center text-xs text-muted-foreground bg-black/10 w-fit px-2 py-1 rounded-md">
              {reportRate}% dari tim hari ini
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/performance" className="outline-none">
        <Card className="border-0 shadow-sm bg-card border border-border text-foreground overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Target Selesai</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">0%</div>
            <div className="flex items-center text-xs text-muted-foreground bg-black/10 w-fit px-2 py-1 rounded-md">
              Progress hari ini
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/daily-uploads" className="outline-none">
        <Card className="border-0 shadow-sm bg-card border border-border text-foreground overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <AlertCircle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Perlu Direview</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="flex items-center text-xs text-muted-foreground bg-black/10 w-fit px-2 py-1 rounded-md">
              Upload bukti harian
            </div>
          </CardContent>
        </Card>
        </Link>
      </div>

      {/* Pending Reports */}
      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="text-xl font-bold text-foreground flex items-center justify-between">
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
              <p className="font-medium text-foreground">Semua anggota sudah laporan hari ini! ??</p>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">Data detail belum tersedia. Cek halaman Laporan Harian.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
