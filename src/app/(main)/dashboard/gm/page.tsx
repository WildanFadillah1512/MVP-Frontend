"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, AlertTriangle, TrendingUp, ArrowUpRight, BarChart3, Building2, Download } from "lucide-react";
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { exportApi } from '@/features/export/api/export.api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function GMDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getCeoData();
        if (res.success) setData(res.data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
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
      link.setAttribute('download', type === 'attendance' ? 'Laporan_Absensi.xlsx' : 'Laporan_Produksi.xlsx');
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!data) return <div>Gagal memuat data.</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* GM Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 border border-[#D7CBB5]  p-6 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-[#28374A]" />
            <span className="text-sm font-semibold text-[#754437]">General Manager Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#3E231B]">Monitoring Operasional</h1>
          <p className="text-[#754437] mt-1">Pantau seluruh divisi, kehadiran, dan target operasional perusahaan.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('attendance')}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D7CBB5] bg-white text-sm font-medium text-[#3E231B] hover:bg-[#FAF3E0] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Absensi
          </button>
          <button
            onClick={() => handleExport('production')}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#28374A] text-[#FAF3E0] text-sm font-medium hover:bg-[#1a2535] transition-colors shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Produksi
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/users" className="outline-none">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#28374A] to-[#1a2535] text-[#FAF3E0] overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-[#D7CBB5] text-sm font-medium">Total Karyawan Aktif</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.employees.total}</div>
            <div className="flex items-center text-xs text-[#D7CBB5] bg-black/20 w-fit px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +{data.employees.newThisMonth} bulan ini
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/daily-reports" className="outline-none">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#89523D] to-[#754437] text-[#FAF3E0] overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <FileText className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-[#D7CBB5] text-sm font-medium">Laporan Harian (Hari ini)</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.reports.submitted} <span className="text-xl text-[#D7CBB5]">/ {data.reports.total}</span></div>
            <div className="flex items-center text-xs text-[#D7CBB5] bg-black/20 w-fit px-2 py-1 rounded-md">
              {Math.round((data.reports.submitted / (data.reports.total || 1)) * 100)}% completion rate
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/cashier" className="outline-none">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#6B6751] to-[#A6A89A] text-[#FAF3E0] overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Building2 className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-[#FAF3E0] text-sm font-medium">Total Omzet Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold mb-2">Rp {(data.cashierRevenue || 0).toLocaleString('id-ID')}</div>
            <div className="flex items-center text-xs text-[#FAF3E0]/80 bg-black/20 w-fit px-2 py-1 rounded-md">
              Semua cabang
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link href="/warehouse" className="outline-none">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#917B43] to-[#6b5a2f] text-[#FAF3E0] overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle className="w-20 h-20" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-[#FAF3E0] text-sm font-medium">Warning Stok</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-2">{data.warnings.lowStock}</div>
            <div className="flex items-center text-xs text-[#FAF3E0]/80 bg-black/20 w-fit px-2 py-1 rounded-md">
              Item Stok Menipis
            </div>
          </CardContent>
        </Card>
        </Link>
      </div>

      {/* Division Performance & Pending Reports */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4 bg-white/90 border border-[#D7CBB5] shadow-md rounded-2xl">
          <CardHeader className="border-b border-[#D7CBB5] pb-4">
            <CardTitle className="text-lg text-[#3E231B] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#28374A]" /> Performa Divisi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {data.divisionPerformance.map((div: any) => (
              <div key={div.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-[#3E231B]">{div.name}</span>
                  <span className={`font-bold ${div.percentage >= 80 ? 'text-[#6B6751]' : div.percentage >= 60 ? 'text-[#917B43]' : 'text-[#89523D]'}`}>{div.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#D7CBB5] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${div.percentage >= 80 ? 'bg-[#6B6751]' : div.percentage >= 60 ? 'bg-[#917B43]' : 'bg-[#89523D]'}`}
                    style={{ width: `${Math.min(100, div.percentage)}%` }}
                  />
                </div>
                <p className="text-xs text-[#754437]">{div.totalMembers} anggota</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3 bg-white/90 border border-[#D7CBB5] shadow-md rounded-2xl">
          <CardHeader className="border-b border-[#D7CBB5] pb-4">
            <CardTitle className="text-lg text-[#3E231B] flex items-center justify-between">
              Belum Laporan
              <span className="text-xs font-normal px-2 py-1 bg-[#89523D]/10 text-[#89523D] rounded-full">
                {data.reports.pendingUsers.length} Orang
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {data.reports.pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-[#6B6751] mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-[#754437]">Semua karyawan sudah submit.</p>
                </div>
              ) : (
                data.reports.pendingUsers.map((u: any) => (
                  <Link key={u.id} href={`/performance?userId=${u.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FAF3E0] transition-colors border border-transparent hover:border-[#D7CBB5]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#28374A] flex items-center justify-center text-[#FAF3E0] font-bold text-sm shadow-sm">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#3E231B]">{u.name}</p>
                        <p className="text-xs font-medium text-[#754437]">{u.division.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#89523D] bg-[#89523D]/10 px-2 py-1 rounded-md">Pending</span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

