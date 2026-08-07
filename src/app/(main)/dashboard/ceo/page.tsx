"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, AlertTriangle, TrendingUp, ArrowUpRight, BarChart3, Building2, Download, Award } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { exportApi } from '@/features/export/api/export.api';

export default function CEODashboard() {
  const pathname = usePathname();
  const [data, setData] = useState<any>(null);
  const [prodStats, setProdStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, prodRes, leaderboardRes] = await Promise.all([
          dashboardApi.getCeoData(),
          dashboardApi.getProductionStats(),
          dashboardApi.getEmployeeLeaderboard()
        ]);
        if (res.success) setData(res.data);
        if (prodRes.success) setProdStats(prodRes.data);
        if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
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
  const isOwnerDashboard = pathname.includes('/dashboard/owner');

  const handleDownloadAll = async () => {
    const response = await exportApi.exportAllStatistics();
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `SikaryaERP_Statistik_Lengkap_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary text-secondary-foreground p-8 rounded-3xl shadow-xl shadow-secondary/10 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{isOwnerDashboard ? 'Owner Dashboard' : 'CEO Dashboard'}</h1>
          <p className="text-secondary-foreground/70 mt-2 font-medium">Ringkasan performa dan operasional perusahaan secara menyeluruh.</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleDownloadAll}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-md flex items-center hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
          >
            <Download className="w-5 h-5" /> Download Laporan
          </button>
          <div className="px-6 py-3 bg-white/10 text-secondary-foreground rounded-xl font-bold flex items-center  border border-white/10">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Live
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/users" className="outline-none">
        <Card className="border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Tim</span>
            </div>
            <p className="text-4xl font-black text-foreground">{data.employees.total}</p>
            <div className="flex items-center text-sm font-medium text-muted-foreground mt-2">
              <ArrowUpRight className="w-4 h-4 mr-1 text-emerald-600" />
              <span className="text-emerald-600 font-bold mr-1">+{data.employees.newThisMonth}</span> bulan ini
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/daily-reports" className="outline-none">
        <Card className="border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent-foreground">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-accent-foreground bg-accent/20 px-2.5 py-1 rounded-full">Laporan</span>
            </div>
            <p className="text-4xl font-black text-foreground">{data.reports.submitted} <span className="text-2xl text-muted-foreground">/ {data.reports.total}</span></p>
            <div className="flex items-center text-sm font-medium text-muted-foreground mt-2">
              {Math.round((data.reports.submitted / (data.reports.total || 1)) * 100)}% submission rate
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/cashier" className="outline-none">
        <Card className="border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">Keuangan</span>
            </div>
            <p className="text-3xl font-black text-foreground">Rp {(data.cashierRevenue || 0).toLocaleString('id-ID')}</p>
            <div className="flex items-center text-sm font-medium text-muted-foreground mt-2">
              Total pendapatan kasir
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/warehouse" className="outline-none">
        <Card className="border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1 rounded-full">Stok</span>
            </div>
            <p className="text-4xl font-black text-foreground">{data.warnings.lowStock}</p>
            <div className="flex items-center text-sm font-medium text-muted-foreground mt-2">
              Item menipis / kritis
            </div>
          </CardContent>
        </Card>
        </Link>
      </div>

      {/* Division + Pending Reports */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Link href="/performance" className="md:col-span-2 lg:col-span-4 outline-none">
        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow h-full">
          <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Performa Divisi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {data.divisionPerformance.map((div: any) => (
              <div key={div.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-foreground">{div.name}</span>
                  <span className={`font-black ${div.percentage >= 80 ? 'text-emerald-600' : div.percentage >= 60 ? 'text-accent-foreground' : 'text-primary'}`}>{div.percentage}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${div.percentage >= 80 ? 'bg-emerald-500' : div.percentage >= 60 ? 'bg-accent' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, div.percentage)}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{div.totalMembers} anggota tim</p>
              </div>
            ))}
          </CardContent>
        </Card>
        </Link>

        <Card className="md:col-span-2 lg:col-span-3 bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
            <CardTitle className="text-lg text-foreground flex items-center justify-between">
              Belum Laporan
              <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800">
                {data.reports.pendingUsers.length} Orang
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {data.reports.pendingUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mb-3 opacity-50" />
                  <p className="text-sm font-bold text-foreground">Semua Tuntas</p>
                  <p className="text-xs mt-1">Semua karyawan hadir sudah mengirimkan laporan.</p>
                </div>
              ) : (
                data.reports.pendingUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{u.name}</p>
                        <p className="text-xs font-medium text-muted-foreground">{u.division.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 px-2.5 py-1 rounded-md">Pending</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Target Status */}
      {prodStats && prodStats.products && prodStats.products.length > 0 && (
        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
            <CardTitle className="text-lg text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Target Produksi Bulan Ini
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                prodStats.overallProgress >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                {prodStats.overallProgress}% Keseluruhan
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prodStats.products.map((p: any) => (
                <div key={p.productName} className={`p-5 rounded-xl border ${
                  p.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10' :
                  p.status === 'ON_TRACK' ? 'border-accent/30 bg-accent/5' :
                  'border-primary/30 bg-primary/5'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-bold text-foreground text-sm leading-tight">{p.productName}</p>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      p.status === 'COMPLETED' ? 'bg-emerald-600 text-white' :
                      p.status === 'ON_TRACK' ? 'bg-accent text-accent-foreground' :
                      'bg-primary text-primary-foreground'
                    }`}>
                      {p.status === 'COMPLETED' ? '✓ Selesai' : p.status === 'ON_TRACK' ? 'Sesuai Track' : '⚠ Perhatian'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        p.status === 'COMPLETED' ? 'bg-emerald-500' : p.status === 'ON_TRACK' ? 'bg-accent' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, p.progress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>{p.actualQty.toLocaleString('id-ID')} / {p.targetQty.toLocaleString('id-ID')}</span>
                    <span className="font-bold text-foreground">{p.progress.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {leaderboard.length > 0 && (
        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-accent-foreground" /> Peringkat Performa Karyawan (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-muted-foreground">Karyawan</th>
                  <th className="px-6 py-4 text-left font-bold text-muted-foreground">Role / Divisi</th>
                  <th className="px-6 py-4 text-right font-bold text-muted-foreground">Absensi</th>
                  <th className="px-6 py-4 text-right font-bold text-muted-foreground">Laporan</th>
                  <th className="px-6 py-4 text-right font-bold text-muted-foreground">Target</th>
                  <th className="px-6 py-4 text-right font-bold text-muted-foreground">KPI Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {leaderboard.slice(0, 10).map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <Link href={`/performance?userId=${employee.id}`} className="hover:text-primary hover:underline">
                        {employee.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground">{employee.role} / {employee.division}</td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">{employee.attendanceScore}%</td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">{employee.reportScore}%</td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">{employee.targetScore}%</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center justify-center font-black px-3 py-1 rounded-full border ${employee.kpiScore >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {employee.kpiScore} <span className="ml-1 opacity-70">({employee.grade})</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
