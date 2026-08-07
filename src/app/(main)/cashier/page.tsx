"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cashierApi } from '@/features/cashier/api/cashier.api';
import { productionApi } from '@/features/production/api/production.api';
import { uploadApi } from '@/features/uploads/api/upload.api';
import { Calculator, Plus, TrendingUp, Wallet, Receipt, Minus, Package, X, Upload } from "lucide-react";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export default function CashierPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productsSold, setProductsSold] = useState<{productId: string; quantity: string; isReject: boolean}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const [formData, setFormData] = useState({
    branchId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    totalCash: '',
    totalTransfer: '',
    totalQris: '',
    totalExpense: '',
    depositProofUrl: '',
    notes: ''
  });

  const [branchForm, setBranchForm] = useState({
    code: '',
    name: '',
    address: ''
  });

  const fetchData = async () => {
    try {
      const [branchRes, reportsRes, prodRes] = await Promise.all([
        cashierApi.getBranches(),
        cashierApi.getReports(),
        productionApi.getProducts()
      ]);
      if (branchRes.success) setBranches(branchRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const addProductRow = () => setProductsSold(prev => [...prev, { productId: '', quantity: '', isReject: false }]);
  const removeProductRow = (i: number) => setProductsSold(prev => prev.filter((_, idx) => idx !== i));
  const updateProductRow = (i: number, field: string, value: any) => {
    setProductsSold(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const [userRole, setUserRole] = useState('');
  const [userDivision, setUserDivision] = useState('');

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const p = JSON.parse(userStr);
      setUserRole(p.role.name);
      setUserDivision(p.division.name);
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId) { toast.error('Pilih cabang terlebih dahulu'); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        productsSold: productsSold.filter(p => p.productId && Number(p.quantity) > 0).map(p => ({
          productId: p.productId,
          quantity: Number(p.quantity),
          isReject: p.isReject
        }))
      };
      const res = await cashierApi.createReport(payload);
      if (res.success) {
        toast.success('Laporan kasir & penjualan berhasil disimpan');
        setFormData({ ...formData, totalCash: '', totalTransfer: '', totalQris: '', totalExpense: '', depositProofUrl: '', notes: '' });
        setProductsSold([]);
        fetchData();
      }
    } catch { toast.error('Gagal menyimpan laporan kasir'); }
    finally { setIsSubmitting(false); }
  };

  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const res = await uploadApi.uploadGenericFile(file, 'CASHIER_DEPOSITS');
      if (res.success) {
        setFormData((current) => ({ ...current, depositProofUrl: res.data.fileUrl }));
        toast.success('Bukti setoran berhasil diupload');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal upload bukti setoran');
    } finally {
      setIsUploadingProof(false);
      event.target.value = '';
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.code || !branchForm.name) {
      toast.error('Kode dan nama cabang wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await cashierApi.createBranch(branchForm);
      if (res.success) {
        toast.success('Cabang berhasil dibuat');
        setBranchForm({ code: '', name: '', address: '' });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal membuat cabang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIncome = (Number(formData.totalCash) || 0) + (Number(formData.totalTransfer) || 0) + (Number(formData.totalQris) || 0);
  const netTotal = totalIncome - (Number(formData.totalExpense) || 0);

  // Summary stats from reports
  const totalOmzet = reports.reduce((s, r) => s + (r.netTotal || 0), 0);
  const todayReports = reports.filter(r => format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));

  const isCashierOrAbove = ['OWNER', 'CEO', 'ADMIN'].includes(userRole) || userDivision === 'KASIR';
  const canSetupBranch = ['OWNER', 'CEO', 'ADMIN'].includes(userRole);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!loading && !isCashierOrAbove) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-2">
          <span className="text-2xl">??</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Akses Ditolak</h2>
          <p className="text-muted-foreground mt-2">Anda tidak memiliki izin untuk melihat halaman Divisi Kasir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Divisi Kasir</h1>
        <p className="text-muted-foreground mt-1">Pencatatan pendapatan harian dan monitoring rekap omzet cabang.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Omzet (Semua Data)</p>
              <p className="text-2xl font-bold mt-1">Rp {totalOmzet.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Laporan Hari Ini</p>
              <p className="text-4xl font-black text-foreground mt-1">{todayReports.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Receipt className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Jumlah Cabang</p>
              <p className="text-4xl font-black text-foreground mt-1">{branches.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
          </div>
          {branches.length === 0 && <p className="text-muted-foreground text-xs mt-2">*Hubungi Admin untuk tambah cabang</p>}
        </div>
      </div>

      {canSetupBranch && (
        <Card className="border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Setup Cabang
            </CardTitle>
            <CardDescription>Tambahkan cabang kasir baru untuk laporan omzet harian</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateBranch} className="grid gap-3 md:grid-cols-4">
              <Input value={branchForm.code} onChange={(e) => setBranchForm({...branchForm, code: e.target.value})} placeholder="Kode cabang" className="rounded-xl" />
              <Input value={branchForm.name} onChange={(e) => setBranchForm({...branchForm, name: e.target.value})} placeholder="Nama cabang" className="rounded-xl" />
              <Input value={branchForm.address} onChange={(e) => setBranchForm({...branchForm, address: e.target.value})} placeholder="Alamat" className="rounded-xl md:col-span-2" />
              <button type="submit" disabled={isSubmitting} className="md:col-span-4 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Tambah Cabang'}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <Card className="lg:col-span-2 border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Input Laporan Harian
            </CardTitle>
            <CardDescription>Catat pendapatan per cabang hari ini</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Tanggal <span className="text-rose-500">*</span></Label>
                <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Cabang <span className="text-rose-500">*</span></Label>
                <Select value={formData.branchId} onValueChange={v => setFormData({...formData, branchId: v || ''})}>
                  <SelectTrigger className="rounded-xl border-border bg-muted/30 overflow-hidden">
                    <SelectValue placeholder="Pilih cabang...">
                      {formData.branchId ? branches.find(b => b.id === formData.branchId)?.name : "Pilih cabang..."}
                    </SelectValue>
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
                    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
                    <Input type="number" step="any" min="0" value={(formData as any)[key]} onChange={e => setFormData({...formData, [key]: e.target.value})} placeholder="Rp 0" className="rounded-xl border-border bg-white  focus-visible:ring-primary h-9 text-sm" />
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                <Label className="font-medium text-foreground">Bukti Setoran</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted/50">
                    <Upload className="h-4 w-4" />
                    {isUploadingProof ? 'Mengupload...' : 'Upload Bukti'}
                    <input type="file" className="hidden" onChange={handleProofUpload} disabled={isUploadingProof} />
                  </label>
                  {formData.depositProofUrl ? (
                    <a href={formData.depositProofUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
                      Bukti sudah terupload
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Kasir akan diingatkan tiap 2 hari jika belum upload laporan/bukti.</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <Minus className="w-4 h-4" /> Pengeluaran
                </p>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Pengeluaran Kas</Label>
                  <Input type="number" step="any" min="0" value={formData.totalExpense} onChange={e => setFormData({...formData, totalExpense: e.target.value})} placeholder="Rp 0" className="rounded-xl border-border bg-white  focus-visible:ring-primary h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Catatan Selisih / Lainnya</Label>
                  <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Opsional" className="rounded-xl border-border bg-white  focus-visible:ring-primary h-9 text-sm" />
                </div>
              </div>

              {/* Products Sold */}
              <div className="space-y-3 p-4 rounded-xl bg-muted/50 dark:bg-primary/10 border border-primary/20 dark:border-primary/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary dark:text-primary flex items-center gap-2">
                    <Package className="w-4 h-4" /> Produk Terjual / Reject
                  </p>
                  <button type="button" onClick={addProductRow}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors">
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>
                {productsSold.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-1">Klik Tambah untuk mencatat produk terjual</p>
                )}
                {productsSold.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      value={row.productId}
                      onChange={e => updateProductRow(i, 'productId', e.target.value)}
                      className="flex-1 text-xs rounded-lg border border-border bg-white  px-2 py-1.5"
                    >
                      <option value="">Pilih produk...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <Input
                      type="number" step="any" min="1"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={e => updateProductRow(i, 'quantity', e.target.value)}
                      className="w-20 h-8 text-xs rounded-lg"
                    />
                    <label className="flex items-center gap-1 text-xs text-rose-600 whitespace-nowrap">
                      <input type="checkbox" checked={row.isReject} onChange={e => updateProductRow(i, 'isReject', e.target.checked)} />
                      Reject
                    </label>
                    <button type="button" onClick={() => removeProductRow(i)} className="text-muted-foreground hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-muted dark:bg-background p-4 space-y-2 text-foreground">
                <div className="flex justify-between text-sm text-muted-foreground">
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

              <button type="submit" disabled={isSubmitting || branches.length === 0} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors shadow-md disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Submit Laporan Kasir'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Tabel Rekapitulasi */}
        <Card className="lg:col-span-3 border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> Rekapitulasi Pendapatan
            </CardTitle>
            <CardDescription>Riwayat laporan kasir yang sudah disubmit</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">Tanggal</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Cabang</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Penginput</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-right">Tunai</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-right">Non-Tunai</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-right">Keluar</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Bukti</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-right">Netto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {reports.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Belum ada laporan kasir</td></tr>
                ) : reports.map(r => (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4 text-muted-foreground whitespace-nowrap text-xs">{format(new Date(r.date), 'dd MMM yyyy', { locale: localeId })}</td>
                    <td className="px-4 py-4 font-semibold text-foreground">{r.branch.name}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{r.createdBy?.name || '-'}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-muted-foreground">Rp {r.totalCash.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-muted-foreground">Rp {(r.totalTransfer + r.totalQris).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-rose-500">Rp {r.totalExpense.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4">
                      {r.depositProofUrl ? (
                        <a href={r.depositProofUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary underline-offset-2 hover:underline">Lihat</a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Belum ada</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">Rp {r.netTotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              {reports.length > 0 && (
                <tfoot className="bg-muted dark:bg-background">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right font-bold text-foreground/80 text-sm">Total Omzet</td>
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
