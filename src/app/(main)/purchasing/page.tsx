"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purchasingApi } from '@/features/purchasing/api/purchasing.api';
import { warehouseApi } from '@/features/warehouse/api/warehouse.api';
import { ShoppingCart, Plus, CheckCircle, Clock, AlertTriangle, Package, Receipt, Bell } from "lucide-react";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  HIGH:   { label: 'Tinggi',  color: 'text-rose-700',   bg: 'bg-rose-100',   border: 'border-rose-200' },
  MEDIUM: { label: 'Sedang',  color: 'text-amber-700',  bg: 'bg-amber-100',  border: 'border-amber-200' },
  LOW:    { label: 'Rendah',  color: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEEDED:    { label: 'Dibutuhkan',  color: 'text-amber-700', bg: 'bg-amber-50' },
  ORDERED:   { label: 'Dipesan',     color: 'text-indigo-700',bg: 'bg-indigo-50' },
  PURCHASED: { label: 'Terbeli',     color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

export default function PurchasingPage() {
  const [needs, setNeeds] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userDivision, setUserDivision] = useState('');
  const [activeTab, setActiveTab] = useState<'needs' | 'purchases'>('needs');

  const [needForm, setNeedForm] = useState({ itemName: '', quantity: '', priority: 'MEDIUM', notes: '' });
  const [purchaseForm, setPurchaseForm] = useState({
    itemName: '', quantity: '', unitPrice: '', supplier: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchData = async () => {
    try {
      const [needsRes, purchRes, recRes] = await Promise.all([
        purchasingApi.getNeeds(),
        purchasingApi.getPurchases(),
        warehouseApi.getRecommendations()
      ]);
      if (needsRes.success) setNeeds(needsRes.data);
      if (purchRes.success) setPurchases(purchRes.data);
      if (recRes.success) setRecommendations(recRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) { const p = JSON.parse(userStr); setUserRole(p.role.name); setUserDivision(p.division.name); }
    fetchData();
  }, []);

  const handleAddNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await purchasingApi.createNeed(needForm);
      if (res.success) { toast.success('Kebutuhan belanja ditambahkan'); setNeedForm({ itemName: '', quantity: '', priority: 'MEDIUM', notes: '' }); fetchData(); }
    } catch { toast.error('Gagal menambahkan kebutuhan'); }
    finally { setIsSubmitting(false); }
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await purchasingApi.createPurchase(purchaseForm);
      if (res.success) { toast.success('Catatan pembelian disimpan'); setPurchaseForm({ ...purchaseForm, itemName: '', quantity: '', unitPrice: '', supplier: '' }); fetchData(); }
    } catch { toast.error('Gagal mencatat pembelian'); }
    finally { setIsSubmitting(false); }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await purchasingApi.updateNeedStatus(id, newStatus);
      if (res.success) { toast.success('Status diupdate'); fetchData(); }
    } catch { toast.error('Gagal update status'); }
  };

  const createNeedFromRecommendation = async (item: any) => {
    try {
      const res = await purchasingApi.createNeed({
        itemName: item.name,
        quantity: item.recommendedQty,
        priority: item.priority,
        notes: `Dari rekomendasi stok gudang. Sisa ${item.currentStock} ${item.unit}, minimum ${item.minStock} ${item.unit}.`
      });
      if (res.success) {
        toast.success('Rekomendasi berhasil masuk ke request belanja');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal membuat request dari rekomendasi');
    }
  };

  const isPurchasingOrAbove = ['OWNER', 'CEO', 'GM', 'ADMIN'].includes(userRole) || userDivision === 'PURCHASING';
  const pendingCount = needs.filter(n => n.status !== 'PURCHASED').length;
  const totalSpend = purchases.reduce((s, p) => s + (p.totalPrice || 0), 0);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Divisi Purchasing</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Daftar kebutuhan belanja, monitoring stok, dan riwayat pembelian.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Item Perlu Dibeli</p>
              <p className="text-4xl font-bold mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total Request Belanja</p>
              <p className="text-4xl font-bold mt-1">{needs.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Package className="w-6 h-6" /></div>
          </div>
        </div>
        {isPurchasingOrAbove && (
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm font-medium">Total Pengeluaran</p>
                <p className="text-2xl font-bold mt-1">Rp {totalSpend.toLocaleString('id-ID')}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Receipt className="w-6 h-6" /></div>
            </div>
          </div>
        )}
      </div>

      {/* Rekomendasi Belanja Otomatis */}
      {recommendations.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200">Rekomendasi Belanja Otomatis</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{recommendations.length} barang gudang di bawah stok minimum — perlu segera dibeli</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                item.priority === 'HIGH'
                  ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50'
                  : 'bg-white border-amber-100 dark:bg-slate-800/50 dark:border-amber-800/30'
              }`}>
                <div className={`w-2 h-full min-h-[40px] rounded-full flex-shrink-0 ${
                  item.priority === 'HIGH' ? 'bg-rose-500' : 'bg-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                  {isPurchasingOrAbove && (
                    <button onClick={() => createNeedFromRecommendation(item)} className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                      Buat Request
                    </button>
                  )}
                  <p className="text-xs text-slate-500">Sisa: {item.currentStock} {item.unit} · Rekomendasi beli: <span className="font-bold text-amber-700 dark:text-amber-300">{item.recommendedQty} {item.unit}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('needs')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'needs' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          📋 Kebutuhan Belanja ({pendingCount} pending)
        </button>
        {isPurchasingOrAbove && (
          <button onClick={() => setActiveTab('purchases')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'purchases' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            🧾 Riwayat Pembelian
          </button>
        )}
      </div>

      {/* TAB: KEBUTUHAN */}
      {activeTab === 'needs' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-primary" /> Ajukan Kebutuhan
              </CardTitle>
              <CardDescription>Request barang yang perlu dibeli</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <form onSubmit={handleAddNeed} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300">Nama Barang <span className="text-rose-500">*</span></Label>
                  <Input required value={needForm.itemName} onChange={e => setNeedForm({...needForm, itemName: e.target.value})} placeholder="Contoh: Tepung Terigu 25kg" className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300">Jumlah (Qty) <span className="text-rose-500">*</span></Label>
                  <Input type="number" required min="1" value={needForm.quantity} onChange={e => setNeedForm({...needForm, quantity: e.target.value})} placeholder="10" className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300">Prioritas</Label>
                  <Select value={needForm.priority} onValueChange={v => setNeedForm({...needForm, priority: v || 'MEDIUM'})}>
                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">🔴 Tinggi — Mendesak</SelectItem>
                      <SelectItem value="MEDIUM">🟡 Sedang</SelectItem>
                      <SelectItem value="LOW">🟢 Rendah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-slate-600 dark:text-slate-300">Catatan <span className="text-slate-400 font-normal text-xs">(Opsional)</span></Label>
                  <Input value={needForm.notes} onChange={e => setNeedForm({...needForm, notes: e.target.value})} placeholder="Merk tertentu, spesifikasi..." className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50">
                  <Plus className="w-4 h-4 inline mr-2" />{isSubmitting ? 'Menyimpan...' : 'Tambah Request'}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Daftar Request Belanja</CardTitle>
              <CardDescription>{needs.length} total request · {pendingCount} belum selesai</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {needs.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Tidak ada request belanja</p>
                  </div>
                ) : needs.map(need => {
                  const pCfg = PRIORITY_CONFIG[need.priority] || PRIORITY_CONFIG['MEDIUM'];
                  const sCfg = STATUS_CONFIG[need.status] || STATUS_CONFIG['NEEDED'];
                  return (
                    <div key={need.id} className="flex justify-between items-start px-6 py-4 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{need.itemName}</span>
                          <span className="text-sm text-slate-500">×{need.quantity}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pCfg.bg} ${pCfg.color} ${pCfg.border}`}>{pCfg.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sCfg.bg} ${sCfg.color}`}>{sCfg.label}</span>
                        </div>
                        {need.notes && <p className="text-xs text-slate-500">{need.notes}</p>}
                      </div>
                      {isPurchasingOrAbove && need.status !== 'PURCHASED' && (
                        <div className="flex gap-2 shrink-0">
                          {need.status === 'NEEDED' && (
                            <button onClick={() => updateStatus(need.id, 'ORDERED')} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                              Dipesan
                            </button>
                          )}
                          <button onClick={() => updateStatus(need.id, 'PURCHASED')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Terbeli
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: RIWAYAT PEMBELIAN */}
      {activeTab === 'purchases' && (
        <div className="grid gap-6 lg:grid-cols-5">
          {isPurchasingOrAbove && (
            <Card className="lg:col-span-2 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-brand-primary" /> Catat Pembelian
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddPurchase} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Tanggal Beli</Label>
                    <Input type="date" required value={purchaseForm.date} onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Nama Barang <span className="text-rose-500">*</span></Label>
                    <Input required value={purchaseForm.itemName} onChange={e => setPurchaseForm({...purchaseForm, itemName: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="font-medium text-slate-600 dark:text-slate-300">Jumlah <span className="text-rose-500">*</span></Label>
                      <Input type="number" required min="1" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium text-slate-600 dark:text-slate-300">Harga Satuan <span className="text-rose-500">*</span></Label>
                      <Input type="number" required min="0" value={purchaseForm.unitPrice} onChange={e => setPurchaseForm({...purchaseForm, unitPrice: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total Harga</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">
                      Rp {((Number(purchaseForm.quantity) || 0) * (Number(purchaseForm.unitPrice) || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Supplier / Toko</Label>
                    <Input value={purchaseForm.supplier} onChange={e => setPurchaseForm({...purchaseForm, supplier: e.target.value})} placeholder="Contoh: Toko Makmur" className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card className={`${isPurchasingOrAbove ? 'lg:col-span-3' : 'lg:col-span-5'} glass-card border-0 shadow-md rounded-2xl overflow-hidden`}>
            <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Buku Riwayat Belanja</CardTitle>
              <CardDescription>Total pengeluaran: Rp {totalSpend.toLocaleString('id-ID')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Tanggal</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Item & Supplier</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Qty</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {purchases.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Belum ada riwayat belanja</td></tr>
                  ) : purchases.map(p => (
                    <tr key={p.id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{format(new Date(p.date), 'dd MMM yyyy', { locale: localeId })}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{p.itemName}</p>
                        <p className="text-xs text-slate-400">Toko: {p.supplier || '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{p.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 dark:text-rose-400 font-mono">
                        Rp {p.totalPrice.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
