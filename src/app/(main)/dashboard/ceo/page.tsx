"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, AlertTriangle, TrendingUp, ArrowUpRight, LineChart } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';

export default function CEODashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getCeoData();
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );
  
  if (!data) return <div>Failed to load data</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">CEO Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Ringkasan performa dan operasional perusahaan hari ini.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg font-medium text-sm flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" /> Live Analytics
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <Card className="border-0 shadow-lg shadow-indigo-500/10 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-indigo-100 text-sm font-medium">Total Karyawan</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.employees.total}</div>
            <div className="flex items-center text-xs text-indigo-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +{data.employees.newThisMonth} bulan ini
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border-0 shadow-lg shadow-violet-500/10 bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <FileText className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-violet-100 text-sm font-medium">Laporan Harian (Hari ini)</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.reports.submitted} <span className="text-xl text-violet-200">/ {data.reports.total}</span></div>
            <div className="flex items-center text-xs text-violet-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              {Math.round((data.reports.submitted / (data.reports.total || 1)) * 100)}% completion rate
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-emerald-100 text-sm font-medium">Target Produksi</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">0%</div>
            <div className="flex items-center text-xs text-emerald-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              Bulan ini (Tahap Integrasi)
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border-0 shadow-lg shadow-rose-500/10 bg-gradient-to-br from-rose-500 to-red-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-rose-100 text-sm font-medium">Warning System</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.warnings.lowStock}</div>
            <div className="flex items-center text-xs text-rose-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              Item Stok Menipis
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 glass-card border-0 shadow-md">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Performa Divisi</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <LineChart className="w-8 h-8" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Chart KPI Divisi sedang dikonfigurasi...</p>
              <p className="text-xs text-slate-400 mt-2">Data analitik lanjutan akan segera hadir.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 glass-card border-0 shadow-md">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center justify-between">
              Belum Laporan
              <span className="text-xs font-normal px-2 py-1 bg-rose-100 text-rose-600 rounded-full">
                {data.reports.pendingUsers.length} Orang
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {data.reports.pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Semua karyawan hadir sudah submit.</p>
                </div>
              ) : (
                data.reports.pendingUsers.map((u: any, idx: number) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                        idx % 3 === 0 ? 'bg-indigo-400' : idx % 3 === 1 ? 'bg-violet-400' : 'bg-cyan-400'
                      }`}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.name}</p>
                        <p className="text-xs font-medium text-brand-primary">{u.division.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-md">Pending</span>
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