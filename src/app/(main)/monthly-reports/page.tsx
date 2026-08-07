"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Archive, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/axios";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function MonthlyReportsPage() {
  const [activeTab, setActiveTab] = useState<'export' | 'history'>('export');
  const [archivedReports, setArchivedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchArchivedReports();
    }
  }, [activeTab]);

  const fetchArchivedReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports');
      if (response.data.success) {
        setArchivedReports(response.data.data || []);
      }
    } catch (error) {
      toast.error('Gagal mengambil riwayat laporan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type: string) => {
    try {
      toast.info(`Menyiapkan data ekspor untuk ${type}...`);
      
      const response = await api.get(`/reports/export?type=${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download berhasil dimulai');
    } catch (error) {
      toast.error(`Endpoint export untuk ${type} sedang dalam pengembangan.`);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="pb-2 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-primary" /> Pusat Laporan & Arsip
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Unduh rekapitulasi data dan lihat riwayat laporan yang sudah diarsip.</p>
        </div>
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('export')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'export' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Ekspor Data
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Riwayat Arsip Laporan
          </button>
        </div>
      </div>

      {activeTab === 'export' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Data Master Gudang</CardTitle>
              <CardDescription>Daftar inventori fisik, batas minimum, dan harga per gram saat ini.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button onClick={() => handleDownload('warehouse')} className="w-full font-bold">
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Data Master Resep</CardTitle>
              <CardDescription>Daftar formula produk akhir, komponen bahan baku, dan perhitungan HPP.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button onClick={() => handleDownload('recipes')} className="w-full font-bold">
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Rekap Absensi (Bulan Ini)</CardTitle>
              <CardDescription>Rekapitulasi total jam kerja, keterlambatan, lembur, dan kehadiran tim.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button onClick={() => handleDownload('attendance')} className="w-full font-bold">
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Laporan Penjualan Kasir</CardTitle>
              <CardDescription>Rekap omset harian/bulanan dari POS kasir untuk dianalisis lebih lanjut.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button onClick={() => handleDownload('sales')} className="w-full font-bold" variant="secondary">
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border/50 flex flex-row items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Arsip Laporan Otomatis</CardTitle>
              <CardDescription>Riwayat pengumpulan laporan harian dari seluruh divisi yang telah diarsipkan.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center">Loading riwayat...</div>
            ) : archivedReports.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">Belum ada riwayat laporan yang diarsipkan.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/20 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground">Karyawan</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Divisi</th>
                    <th className="px-6 py-4 font-semibold text-foreground text-center">Tipe Laporan</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Tanggal</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Isi Laporan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {archivedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{report.user.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{report.user.division?.name || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                           Laporan Harian
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-sm truncate" title={report.content}>
                        {report.content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
