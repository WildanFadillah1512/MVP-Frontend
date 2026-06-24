"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Clock, Download, TrendingUp, ArrowUpRight } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { exportApi } from '@/features/export/api/export.api';
import { toast } from 'sonner';

export default function ManagerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getManagerData();
        if (res.success) setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = async (type: 'attendance' | 'production') => {
    setIsExporting(true);
    try {
      const response = type === 'attendance'
        ? await exportApi.exportAttendances()
        : await exportApi.exportProduction();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', type === 'attendance' ? 'Laporan_Absensi_Tim.xlsx' : 'Laporan_Produksi_Tim.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan berhasil didownload');
    } catch {
      toast.error('Gagal download laporan');
    } finally {
      setIsExporting(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Manager Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau performa, kehadiran, dan laporan tim Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('attendance')}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Absensi
          </button>
          <button
            onClick={() => handleExport('production')}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Laporan Kerja
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg shadow-indigo-500/10 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-indigo-100 text-sm font-medium">Anggota Tim</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">
              {data.team.activeToday} <span className="text-xl text-indigo-200">/ {data.team.total}</span>
            </div>
            <div className="flex items-center text-xs text-indigo-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Aktif hari ini
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
            <div className="flex items-center text-xs text-violet-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              {reportRate}% dari tim hari ini
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-emerald-100 text-sm font-medium">Target Tim</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">0%</div>
            <div className="flex items-center text-xs text-emerald-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              Progress bulan ini
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-amber-500/10 bg-gradient-to-br from-amber-500 to-orange-500 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Clock className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-amber-100 text-sm font-medium">Pengajuan Cuti</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.leaves.pendingApproval}</div>
            <div className="flex items-center text-xs text-amber-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              Menunggu persetujuan
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analisa */}
      <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-primary" /> Analisa Performa Tim
          </CardTitle>
          <CardDescription>Visualisasi pencapaian KPI bulanan akan tersedia setelah data terkumpul</CardDescription>
        </CardHeader>
        <CardContent className="h-[220px] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Chart KPI sedang dikonfigurasi</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Data analitik lanjutan akan segera hadir</p>
        </CardContent>
      </Card>
    </div>
  );
}
