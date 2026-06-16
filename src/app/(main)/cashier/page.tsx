"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cashierApi } from '@/features/cashier/api/cashier.api';
import { Calculator, Plus, TrendingUp, Wallet, Receipt, Minus } from "lucide-react";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export default function CashierPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    branchId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    totalCash: '',
    totalTransfer: '',
    totalQris: '',
    totalExpense: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [branchRes, reportsRes] = await Promise.all([
        cashierApi.getBranches(),
        cashierApi.getReports()
      ]);
      if (branchRes.success) setBranches(branchRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId) { toast.error('Pilih cabang terlebih dahulu'); return; }
    setIsSubmitting(true);
    try {
      const res = await cashierApi.createReport(formData);
      if (res.success) {
        toast.success('Laporan kasir berhasil disimpan');
        setFormData({ ...formData, totalCash: '', totalTransfer: '', totalQris: '', totalExpense: '', notes: '' });
        fetchData();
      }
    } catch { toast.error('Gagal menyimpan laporan kasir'); }
    finally { setIsSubmitting(false); }
  };

  const totalIncome = (Number(formData.totalCash) || 0) + (Number(formData.totalTransfer) || 0) + (Number(formData.totalQris) || 0);
  const netTotal = totalIncome - (Number(formData.totalExpense) || 0);

  // Summary stats from reports
  const totalOmzet = reports.reduce((s, r) => s + (r.netTotal || 0), 0);
  const todayReports = reports.filter(r => format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Divisi Kasir</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Pencatatan pendapatan harian dan monitoring rekap omzet cabang.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Omzet (Semua Data)</p>
              <p className="text-2xl font-bold mt-1">Rp {totalOmzet.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Laporan Hari Ini</p>
              <p className="text-4xl font-bold mt-1">{todayReports.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Receipt className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium">Jumlah Cabang</p>
              <p className="text-4xl font-bold mt-1">{branches.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
          </div>
          {branches.length === 0 && <p className="text-violet-200 text-xs mt-2">*Hubungi Admin untuk tambah cabang</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <Card className="lg:col-span-2 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-primary" /> Input Laporan Harian
            </CardTitle>
            <CardDescription>Catat pendapatan per cabang hari ini</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-medium text-slate-600 dark:text-slate-300">Tanggal <span className="text-rose-500">*</span></Label>
                <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-slate-600 dark:text-slate-300">Cabang <span className="text-rose-500">*</span></Label>
                <Select value={formData.branchId} onValueChange={v => setFormData({...formData, branchId: v || ''})}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <SelectValue placeholder="Pilih cabang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.length === 0 && <SelectItem value="none" disabled>Tidak ada data cabang — hubungi Admin</SelectItem>}
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.code} — {b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Rincian Pendapatan
                </p>
                {[
                  { label: 'Uang Tunai (Cash)', key: 'totalCash' },
                  { label: 'Transfer Bank', key: 'totalTransfer' },
                  { label: 'QRIS', key: 'totalQris' },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</Label>
                    <Input type="number" min="0" value={(formData as any)[key]} onChange={e => setFormData({...formData, [key]: e.target.value})} placeholder="Rp 0" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-visible:ring-brand-primary h-9 text-sm" />
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <Minus className="w-4 h-4" /> Pengeluaran
                </p>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Pengeluaran Kas</Label>
                  <Input type="number" min="0" value={formData.totalExpense} onChange={e => setFormData({...formData, totalExpense: e.target.value})} placeholder="Rp 0" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-visible:ring-brand-primary h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Catatan Selisih / Lainnya</Label>
                  <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Opsional" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-visible:ring-brand-primary h-9 text-sm" />
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-slate-800 dark:bg-slate-950 p-4 space-y-2 text-white">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Total Kotor</span>
                  <span className="font-mono">Rp {totalIncome.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-slate-700 pt-2">
                  <span>Netto</span>
                  <span className={`font-mono ${netTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Rp {netTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting || branches.length === 0} className="w-full h-11 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Submit Laporan Kasir'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Tabel Rekapitulasi */}
        <Card className="lg:col-span-3 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-brand-primary" /> Rekapitulasi Pendapatan
            </CardTitle>
            <CardDescription>Riwayat laporan kasir yang sudah disubmit</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Tanggal</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Cabang</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Tunai</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Non-Tunai</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Keluar</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Netto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {reports.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Belum ada laporan kasir</td></tr>
                ) : reports.map(r => (
                  <tr key={r.id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap text-xs">{format(new Date(r.date), 'dd MMM yyyy', { locale: localeId })}</td>
                    <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-200">{r.branch.name}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">Rp {r.totalCash.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">Rp {(r.totalTransfer + r.totalQris).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-rose-500">Rp {r.totalExpense.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">Rp {r.netTotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              {reports.length > 0 && (
                <tfoot className="bg-slate-800 dark:bg-slate-950">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right font-bold text-slate-200 text-sm">Total Omzet</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono">Rp {totalOmzet.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}