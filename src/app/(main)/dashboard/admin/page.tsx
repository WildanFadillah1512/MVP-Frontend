"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, AlertTriangle, Settings, ShieldCheck, ArrowUpRight, ClipboardList } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Admin uses the same CEO data endpoint since they have full access
        const res = await dashboardApi.getCeoData();
        if (res.success) setData(res.data);
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

  if (!data) return <div>Gagal memuat data dashboard.</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola sistem, pengguna, dan pantau aktivitas operasional.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-lg font-medium text-sm flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2" /> Admin Access
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        <Card className="border-0 shadow-lg shadow-violet-500/10 bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <FileText className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-violet-100 text-sm font-medium">Laporan Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">
              {data.reports.submitted} <span className="text-xl text-violet-200">/ {data.reports.total}</span>
            </div>
            <div className="flex items-center text-xs text-violet-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              {Math.round((data.reports.submitted / (data.reports.total || 1)) * 100)}% completion rate
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-emerald-100 text-sm font-medium">Karyawan Aktif</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.employees.total}</div>
            <div className="flex items-center text-xs text-emerald-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              Semua divisi
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-rose-500/10 bg-gradient-to-br from-rose-500 to-red-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-rose-100 text-sm font-medium">Warning Stok</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.warnings.lowStock}</div>
            <div className="flex items-center text-xs text-rose-100 bg-black/10 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
              Item menipis di gudang
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action + Pending Reports */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Actions */}
        <Card className="col-span-3 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-primary" /> Aksi Cepat Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Kelola User', href: '/users', icon: Users, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-900/50' },
              { label: 'Produksi', href: '/production', icon: ClipboardList, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', hover: 'hover:bg-violet-200 dark:hover:bg-violet-900/50' },
              { label: 'Gudang', href: '/warehouse', icon: AlertTriangle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/50' },
              { label: 'Purchasing', href: '/purchasing', icon: FileText, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', hover: 'hover:bg-amber-200 dark:hover:bg-amber-900/50' },
              { label: 'Kasir', href: '/cashier', icon: ShieldCheck, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', hover: 'hover:bg-rose-200 dark:hover:bg-rose-900/50' },
              { label: 'Laporan', href: '/daily-reports', icon: FileText, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', hover: 'hover:bg-cyan-200 dark:hover:bg-cyan-900/50' },
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

        {/* Pending Reports */}
        <Card className="col-span-4 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center justify-between">
              Karyawan Belum Laporan
              <span className="text-xs font-normal px-3 py-1 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-full">
                {data.reports.pendingUsers.length} Orang
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {data.reports.pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Semua karyawan sudah submit laporan!</p>
                </div>
              ) : (
                data.reports.pendingUsers.map((u: any, idx: number) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-sm ${
                        idx % 3 === 0 ? 'bg-indigo-400' : idx % 3 === 1 ? 'bg-violet-400' : 'bg-cyan-400'
                      }`}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.name}</p>
                        <p className="text-xs font-medium text-brand-primary">{u.division.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg">
                      Pending
                    </span>
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

