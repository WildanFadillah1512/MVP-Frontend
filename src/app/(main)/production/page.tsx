"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { productionApi } from '@/features/production/api/production.api';
import { warehouseApi } from '@/features/warehouse/api/warehouse.api';
import { Package, Plus, ClipboardList, BarChart3, AlertTriangle, TrendingUp, Box, Target, PackagePlus, CheckCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProductionPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [stockSummary, setStockSummary] = useState<any[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'matrix' | 'materials' | 'targets'>('input');
  const [productionDrafts, setProductionDrafts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    rejectQty: '',
    rejectReason: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const [materialForm, setMaterialForm] = useState({
    warehouseItemId: '',
    quantity: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const [targetForm, setTargetForm] = useState({
    productId: '',
    targetMonth: format(new Date(), 'yyyy-MM'),
    targetQty: '',
    notes: ''
  });

  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    category: ''
  });

  const [initialStockForm, setInitialStockForm] = useState({
    productId: '',
    quantity: '',
    stockDate: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  
  const [userRole, setUserRole] = useState('');
  const [userDivision, setUserDivision] = useState('');

  const fetchData = async () => {
    try {
      const [prodRes, recRes, whRes, targetRes, stockRes] = await Promise.all([
        productionApi.getProducts(),
        productionApi.getRecords(),
        warehouseApi.getItems(),
        productionApi.getTargets({ month: format(new Date(), 'MM'), year: format(new Date(), 'yyyy') }),
        productionApi.getStockSummary()
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (recRes.success) setRecords(recRes.data);
      if (whRes.success) setWarehouseItems(whRes.data);
      if (targetRes.success) setTargets(targetRes.data);
      if (stockRes.success) setStockSummary(stockRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!formData.productId || !formData.quantity) {
      toast.error('Produk dan Jumlah wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await productionApi.createRecord(formData);
      if (res.success) {
        toast.success('Laporan produksi berhasil disimpan');
        setFormData({ ...formData, quantity: '', rejectQty: '', rejectReason: '', notes: '' });
        fetchData();
      }
    } catch { toast.error('Gagal menyimpan laporan'); }
    finally { setIsSubmitting(false); }
  };

  const addProductionDraft = () => {
    if (!formData.productId || !formData.quantity) {
      toast.error('Produk dan Jumlah wajib diisi');
      return;
    }
    setProductionDrafts([...productionDrafts, { ...formData, id: `${Date.now()}-${Math.random()}` }]);
    setFormData({ ...formData, productId: '', quantity: '', rejectQty: '', rejectReason: '', notes: '' });
  };

  const removeProductionDraft = (id: string) => {
    setProductionDrafts(productionDrafts.filter((draft) => draft.id !== id));
  };

  const handleSubmitDrafts = async () => {
    if (productionDrafts.length === 0) {
      toast.error('Belum ada draft produksi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await productionApi.createRecordsBulk(productionDrafts.map(({ id, ...draft }) => draft));
      if (res.success) {
        toast.success(res.message || 'Semua laporan produksi berhasil disimpan');
        setProductionDrafts([]);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan draft produksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.warehouseItemId || !materialForm.quantity) {
      toast.error('Bahan baku dan Jumlah wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await productionApi.useMaterials(materialForm);
      if (res.success) {
        toast.success('Pemakaian bahan baku berhasil dicatat');
        setMaterialForm({ ...materialForm, quantity: '', notes: '' });
        fetchData();
      }
    } catch (error: any) { 
      toast.error(error?.response?.data?.message || 'Gagal mencatat pemakaian'); 
    }
    finally { setIsSubmitting(false); }
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetForm.productId || !targetForm.targetQty) {
      toast.error('Produk dan jumlah target wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await productionApi.createTarget({
        ...targetForm,
        targetMonth: `${targetForm.targetMonth}-01`
      });
      if (res.success) {
        toast.success('Target produksi berhasil dibuat');
        setTargetForm({ ...targetForm, productId: '', targetQty: '', notes: '' });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal membuat target produksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.code || !productForm.name || !productForm.category) {
      toast.error('Kode, nama, dan kategori produk wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await productionApi.createProduct(productForm);
      if (res.success) {
        toast.success('Produk berhasil dibuat');
        setProductForm({ code: '', name: '', category: '' });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal membuat produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetInitialStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialStockForm.productId || initialStockForm.quantity === '') {
      toast.error('Produk dan stok awal wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await productionApi.setInitialStock(initialStockForm);
      if (res.success) {
        toast.success(res.message || 'Stok awal produk jadi berhasil disimpan');
        setInitialStockForm({ ...initialStockForm, productId: '', quantity: '', notes: '' });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan stok awal produk jadi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build monthly matrix: group records by product and by date
  const now = new Date();
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  const currentMonth = format(now, 'yyyy-MM');
  const monthRecords = records.filter(r => format(new Date(r.date), 'yyyy-MM') === currentMonth);

  // Group by product
  const productMap: Record<string, { name: string; code: string; byDay: Record<string, number>; total: number; rejectTotal: number }> = {};
  monthRecords.forEach(r => {
    const key = r.product.id;
    const dayKey = format(new Date(r.date), 'dd');
    if (!productMap[key]) {
      productMap[key] = { name: r.product.name, code: r.product.code, byDay: {}, total: 0, rejectTotal: 0 };
    }
    const acceptedQty = Math.max(0, (r.quantity || 0) - (r.rejectQty || 0));
    productMap[key].byDay[dayKey] = (productMap[key].byDay[dayKey] || 0) + acceptedQty;
    productMap[key].total += acceptedQty;
    productMap[key].rejectTotal += r.rejectQty || 0;
  });

  // Stats
  const totalThisMonth = monthRecords.reduce((s, r) => s + Math.max(0, (r.quantity || 0) - (r.rejectQty || 0)), 0);
  const totalRejectThisMonth = monthRecords.reduce((s, r) => s + (r.rejectQty || 0), 0);
  const uniqueDays = new Set(monthRecords.map(r => format(new Date(r.date), 'yyyy-MM-dd'))).size;

  const isProduksiOrAbove = ['OWNER', 'CEO', 'GM', 'ADMIN'].includes(userRole) || userDivision === 'PRODUKSI';
  const canSetupProduct = ['OWNER', 'CEO', 'GM', 'ADMIN', 'MANAGER'].includes(userRole);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!loading && !isProduksiOrAbove) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center gap-4">
        <AlertTriangle className="w-16 h-16 text-rose-500 opacity-50" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Akses Ditolak</h2>
          <p className="text-muted-foreground mt-2">Anda tidak memiliki izin untuk melihat halaman Divisi Produksi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Divisi Produksi</h1>
        <p className="text-muted-foreground mt-1">Pencatatan produksi harian, stok produk jadi, dan matriks bulanan.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Produksi Bulan Ini</p>
              <p className="text-4xl font-black text-foreground mt-1">{totalThisMonth.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Hari Aktif Produksi</p>
              <p className="text-4xl font-black text-foreground mt-1">{uniqueDays} <span className="text-xl font-normal text-muted-foreground">hari</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ${products.length === 0 ? 'bg-rose-50 border border-rose-200' : 'bg-card border border-border'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Jenis Produk Aktif</p>
              <p className={`text-4xl font-black mt-1 ${products.length === 0 ? 'text-rose-600' : 'text-foreground'}`}>{products.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {products.length === 0 ? <AlertTriangle className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
            </div>
          </div>
          {products.length === 0 && <p className="text-muted-foreground text-xs mt-2">*Hubungi Admin untuk tambah data produk</p>}
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm md:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Reject Bulan Ini</p>
              <p className="text-4xl font-black text-foreground mt-1">{totalRejectThisMonth.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl w-fit">
          {(['input', 'materials', 'targets', 'matrix'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground dark:hover:text-foreground/80'
              }`}
            >
              {tab === 'input' && '?? Input Harian'}
              {tab === 'materials' && '?? Pakai Bahan Baku'}
              {tab === 'matrix' && '?? Matriks Bulanan'}
              {tab === 'targets' && 'Target Bulanan'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setActiveTab('input')}
          className="ml-auto px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Input Produksi
        </button>
      </div>

      {canSetupProduct && (
        <Card className="border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Setup Produk
            </CardTitle>
            <CardDescription>Tambahkan master produk agar bisa dipakai produksi, target, dan kasir</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateProduct} className="grid gap-3 md:grid-cols-4">
              <Input value={productForm.code} onChange={(e) => setProductForm({...productForm, code: e.target.value})} placeholder="Kode produk" className="rounded-xl" />
              <Input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} placeholder="Nama produk" className="rounded-xl md:col-span-2" />
              <Input value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} placeholder="Kategori" className="rounded-xl" />
              <button type="submit" disabled={isSubmitting} className="md:col-span-4 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Tambah Produk'}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Stok Produk Jadi
          </CardTitle>
          <CardDescription>Stok aktual dari saldo awal, produksi masuk, penjualan kasir, dan reject cabang</CardDescription>
        </CardHeader>
        {canSetupProduct && (
          <div className="border-b border-border bg-[#FAF3E0]/45 p-6 /30">
            <div className="mb-4 flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Set Stok Awal Produk Jadi</p>
                <p className="text-xs text-muted-foreground">Dipakai saat go-live agar saldo awal tidak tercatat sebagai produksi harian.</p>
              </div>
            </div>
            <form onSubmit={handleSetInitialStock} className="grid gap-3 md:grid-cols-5">
              <Select value={initialStockForm.productId} onValueChange={(val) => setInitialStockForm({...initialStockForm, productId: val || ''})}>
                <SelectTrigger className="rounded-xl overflow-hidden">
                  <SelectValue placeholder="Pilih produk...">
                    {initialStockForm.productId ? products.find(p => p.id === initialStockForm.productId)?.name : "Pilih produk..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="number" step="any"
                min="0"
                value={initialStockForm.quantity}
                onChange={(e) => setInitialStockForm({...initialStockForm, quantity: e.target.value})}
                placeholder="Stok awal"
                className="rounded-xl"
              />
              <Input
                type="date"
                value={initialStockForm.stockDate}
                onChange={(e) => setInitialStockForm({...initialStockForm, stockDate: e.target.value})}
                className="rounded-xl"
              />
              <Input
                value={initialStockForm.notes}
                onChange={(e) => setInitialStockForm({...initialStockForm, notes: e.target.value})}
                placeholder="Catatan opsional"
                className="rounded-xl"
              />
              <button type="submit" disabled={isSubmitting || products.length === 0} className="h-10 rounded-xl bg-primary px-4 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Stok Awal'}
              </button>
            </form>
          </div>
        )}
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-foreground">Produk</th>
                <th className="px-4 py-3 font-semibold text-foreground text-right">Masuk</th>
                <th className="px-4 py-3 font-semibold text-foreground text-right">Keluar</th>
                <th className="px-4 py-3 font-semibold text-foreground text-right">Saldo Awal/Koreksi</th>
                <th className="px-4 py-3 font-semibold text-foreground text-right">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {stockSummary.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Belum ada pergerakan stok produk</td></tr>
              ) : stockSummary.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-bold">{item.stockIn.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-bold">{item.stockOut.toLocaleString('id-ID')}</td>
                  <td className={`px-4 py-3 text-right font-bold ${item.adjustments < 0 ? 'text-rose-600' : 'text-amber-600'}`}>{item.adjustments.toLocaleString('id-ID')}</td>
                  <td className={`px-4 py-3 text-right font-bold ${item.currentStock <= 0 ? 'text-rose-600' : 'text-indigo-600'}`}>{item.currentStock.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" /> Stok Bahan Gudang Realtime
          </CardTitle>
          <CardDescription>Saldo bahan baku yang akan otomatis berkurang ketika produksi memakai resep.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-foreground">Bahan</th>
                <th className="px-4 py-3 font-semibold text-foreground text-right">Stok</th>
                <th className="px-4 py-3 font-semibold text-foreground text-right">Harga/Gram</th>
                <th className="px-4 py-3 font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {warehouseItems.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Belum ada data gudang</td></tr>
              ) : warehouseItems.slice(0, 12).map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${item.currentStock <= item.minStock ? 'text-rose-600' : 'text-foreground'}`}>
                    {item.currentStock.toLocaleString('id-ID')} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    Rp {Number(item.pricePerGram || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    {item.currentStock <= item.minStock ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">Restock</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Aman</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* TAB: INPUT HARIAN */}
      {activeTab === 'input' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2 border-border shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-card/50 border-b border-border p-6">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Input Hasil Produksi
              </CardTitle>
              <CardDescription>Catat hasil produk jadi hari ini</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Tanggal Produksi</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Pilih Produk <span className="text-rose-500">*</span></Label>
                  <Select value={formData.productId} onValueChange={(val) => setFormData({...formData, productId: val || ''})}>
                    <SelectTrigger className="rounded-xl border-border bg-muted/30 overflow-hidden">
                      <SelectValue placeholder="Pilih produk...">
                        {formData.productId ? products.find(p => p.id === formData.productId)?.name : "Pilih produk..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 && <SelectItem value="none" disabled>Tidak ada data produk — hubungi Admin</SelectItem>}
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Jumlah Hasil (Qty) <span className="text-rose-500">*</span></Label>
                  <Input
                    type="number" step="any" min="1"
                    placeholder="Contoh: 100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                    className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">Qty Reject</Label>
                    <Input
                      type="number" step="any" min="0"
                      placeholder="0"
                      value={formData.rejectQty}
                      onChange={(e) => setFormData({...formData, rejectQty: e.target.value})}
                      className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">Alasan Reject</Label>
                    <Input
                      placeholder="Cacat, gosong, rusak..."
                      value={formData.rejectReason}
                      onChange={(e) => setFormData({...formData, rejectReason: e.target.value})}
                      className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Catatan <span className="text-muted-foreground font-normal text-xs">(Opsional)</span></Label>
                  <Input
                    placeholder="Misal: Ada cacat 5 unit"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={addProductionDraft}
                    disabled={isSubmitting || products.length === 0}
                    className="h-11 rounded-xl border border-primary/30 bg-primary/5 text-primary font-semibold transition-colors hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah Item
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || products.length === 0}
                    className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Satu Item'}
                  </button>
                </div>
                {productionDrafts.length > 0 && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-bold text-foreground">Daftar Item ({productionDrafts.length})</p>
                      <button type="button" onClick={handleSubmitDrafts} disabled={isSubmitting} className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Simpan Semua Item
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {productionDrafts.map((draft) => {
                        const product = products.find((item) => item.id === draft.productId);
                        return (
                          <div key={draft.id} className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm">
                            <span className="font-semibold text-foreground">{product?.name || 'Produk'} · {draft.quantity} qty</span>
                            <button type="button" onClick={() => removeProductionDraft(draft.id)} className="text-xs font-bold text-rose-600">Hapus</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-border shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-card/50 border-b border-border p-6">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Riwayat Produksi
              </CardTitle>
              <CardDescription>Rekap hasil produk jadi yang sudah dicatat</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-foreground">Tanggal</th>
                      <th className="px-6 py-3 font-semibold text-foreground">Kode</th>
                      <th className="px-6 py-3 font-semibold text-foreground">Nama Produk</th>
                      <th className="px-6 py-3 font-semibold text-foreground text-right">Qty</th>
                      <th className="px-6 py-3 font-semibold text-foreground text-right">Reject</th>
                      <th className="px-6 py-3 font-semibold text-foreground text-right">Stok Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {records.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Belum ada catatan produksi</td></tr>
                    ) : (
                      records.map((record) => (
                        <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 text-muted-foreground">{format(new Date(record.date), 'dd MMM yyyy', { locale: localeId })}</td>
                          <td className="px-6 py-4 font-mono text-xs bg-muted/50 dark:bg-primary/10 text-primary dark:text-primary rounded mx-2">{record.product.code}</td>
                          <td className="px-6 py-4 font-semibold text-foreground">{record.product.name}</td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">+{record.quantity.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 text-right font-bold text-rose-600 dark:text-rose-400">{(record.rejectQty || 0).toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{Math.max(0, (record.quantity || 0) - (record.rejectQty || 0)).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: PAKAI BAHAN BAKU */}
      {activeTab === 'materials' && (
        <Card className="border-border shadow-md rounded-2xl overflow-hidden max-w-3xl">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Box className="w-5 h-5 text-amber-500" /> Penggunaan Bahan Baku
            </CardTitle>
            <CardDescription>Catat bahan baku dari gudang yang digunakan untuk produksi</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUseMaterial} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Tanggal Penggunaan</Label>
                <Input
                  type="date"
                  value={materialForm.date}
                  onChange={(e) => setMaterialForm({...materialForm, date: e.target.value})}
                  required
                  className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Pilih Bahan Baku <span className="text-rose-500">*</span></Label>
                <Select value={materialForm.warehouseItemId} onValueChange={(val) => setMaterialForm({...materialForm, warehouseItemId: val || ''})}>
                  <SelectTrigger className="rounded-xl border-border bg-muted/30 overflow-hidden">
                    <SelectValue placeholder="Pilih barang dari gudang...">
                      {materialForm.warehouseItemId ? warehouseItems.find(w => w.id === materialForm.warehouseItemId)?.name : "Pilih barang dari gudang..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseItems.length === 0 && <SelectItem value="none" disabled>Tidak ada stok gudang</SelectItem>}
                    {warehouseItems.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} (Sisa: {w.currentStock} {w.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Jumlah Terpakai <span className="text-rose-500">*</span></Label>
                <Input
                  type="number" step="any" min="1"
                  placeholder="Contoh: 5"
                  value={materialForm.quantity}
                  onChange={(e) => setMaterialForm({...materialForm, quantity: e.target.value})}
                  required
                  className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Catatan Penggunaan</Label>
                <Input
                  placeholder="Misal: Untuk batch pagi"
                  value={materialForm.notes}
                  onChange={(e) => setMaterialForm({...materialForm, notes: e.target.value})}
                  className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || warehouseItems.length === 0}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Memproses...' : 'Potong Stok Gudang'}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'targets' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2 border-border shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-card/50 border-b border-border p-6">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Buat Target Produksi
              </CardTitle>
              <CardDescription>Target bulanan per produk untuk monitoring CEO/Owner</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateTarget} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Bulan Target</Label>
                  <Input type="month" value={targetForm.targetMonth} onChange={(e) => setTargetForm({...targetForm, targetMonth: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Produk</Label>
                  <Select value={targetForm.productId} onValueChange={(val) => setTargetForm({...targetForm, productId: val || ''})}>
                    <SelectTrigger className="rounded-xl overflow-hidden">
                      <SelectValue placeholder="Pilih produk...">
                        {targetForm.productId ? products.find(p => p.id === targetForm.productId)?.name : "Pilih produk..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Jumlah Target</Label>
                  <Input type="number" step="any" min="1" value={targetForm.targetQty} onChange={(e) => setTargetForm({...targetForm, targetQty: e.target.value})} placeholder="Contoh: 5000" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Catatan</Label>
                  <Input value={targetForm.notes} onChange={(e) => setTargetForm({...targetForm, notes: e.target.value})} placeholder="Opsional" className="rounded-xl" />
                </div>
                <button type="submit" disabled={isSubmitting || products.length === 0} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors shadow-md disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Target'}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-border shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-card/50 border-b border-border p-6">
              <CardTitle className="text-xl font-bold text-foreground">Progress Target Bulanan</CardTitle>
              <CardDescription>Warning otomatis muncul jika realisasi di bawah 80%</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {targets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">Belum ada target produksi bulan ini</p>
                ) : targets.map((target) => (
                  <div key={target.id} className="p-5">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{target.product?.name}</p>
                        <p className="text-xs text-muted-foreground">{target.actualQty.toLocaleString('id-ID')} / {target.targetQty.toLocaleString('id-ID')} unit</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${target.status === 'WARNING' ? 'bg-rose-100 text-rose-700' : target.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {target.status === 'WARNING' ? 'Warning' : target.status === 'COMPLETED' ? 'Tercapai' : 'On Track'}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${target.status === 'WARNING' ? 'bg-rose-500' : target.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, target.progress || 0)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Gap: {target.gap.toLocaleString('id-ID')}</span>
                      <span>{Number(target.progress || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: MATRIKS BULANAN */}
      {activeTab === 'matrix' && (
        <Card className="border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Matriks Produksi Bulanan
            </CardTitle>
            <CardDescription>
              Rekap produksi per produk sepanjang {format(now, 'MMMM yyyy', { locale: localeId })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {Object.keys(productMap).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Belum ada data produksi bulan ini</p>
                <p className="text-sm text-muted-foreground mt-1">Input data produksi di tab "Input Harian"</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="text-sm text-left w-full">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-foreground sticky left-0 bg-muted/30 min-w-[140px]">Produk</th>
                      {daysInMonth.map(day => (
                        <th key={format(day, 'd')} className="px-2 py-3 text-center font-semibold text-muted-foreground min-w-[36px]">
                          {format(day, 'd')}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right font-bold text-foreground dark:text-foreground/80 sticky right-0 bg-muted/30">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {Object.values(productMap).map((prod) => (
                      <tr key={prod.code} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-card">
                          <p className="font-semibold text-foreground text-xs">{prod.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{prod.code} · reject {prod.rejectTotal}</p>
                        </td>
                        {daysInMonth.map(day => {
                          const dayKey = format(day, 'dd');
                          const val = prod.byDay[dayKey];
                          return (
                            <td key={dayKey} className="px-2 py-3 text-center">
                              {val ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary font-bold text-xs">
                                  {val}
                                </span>
                              ) : (
                                <span className="text-foreground/80 dark:text-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right sticky right-0 bg-card">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{prod.total.toLocaleString('id-ID')}</span>
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-4 py-3 sticky left-0 bg-muted/30 text-foreground dark:text-foreground/80">TOTAL</td>
                      {daysInMonth.map(day => {
                        const dayKey = format(day, 'dd');
                        const dayTotal = Object.values(productMap).reduce((s, p) => s + (p.byDay[dayKey] || 0), 0);
                        return (
                          <td key={dayKey} className="px-2 py-3 text-center text-foreground dark:text-foreground/80">
                            {dayTotal > 0 ? dayTotal : <span className="text-muted-foreground dark:text-foreground">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right sticky right-0 bg-muted/30 text-indigo-600 dark:text-indigo-400">
                        {totalThisMonth.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
