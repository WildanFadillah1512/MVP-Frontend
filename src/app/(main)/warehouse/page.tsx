"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { warehouseApi } from '@/features/warehouse/api/warehouse.api';
import { Box, Plus, Minus, ArrowLeftRight, AlertTriangle, Package2, Activity } from "lucide-react";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export default function WarehousePage() {
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userDivision, setUserDivision] = useState('');
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');

  const [formData, setFormData] = useState({ warehouseItemId: '', type: 'IN', quantity: '', notes: '' });

  const fetchData = async () => {
    try {
      const [itemRes, movRes] = await Promise.all([warehouseApi.getItems(), warehouseApi.getMovements()]);
      if (itemRes.success) setItems(itemRes.data);
      if (movRes.success) setMovements(movRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) { const p = JSON.parse(userStr); setUserRole(p.role.name); setUserDivision(p.division.name); }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouseItemId) { toast.error('Pilih barang terlebih dahulu'); return; }
    setIsSubmitting(true);
    try {
      const res = await warehouseApi.createMovement(formData);
      if (res.success) {
        toast.success(`Stok ${formData.type === 'IN' ? 'Masuk' : 'Keluar'} berhasil dicatat`);
        setFormData({ ...formData, quantity: '', notes: '' });
        fetchData();
      }
    } catch { toast.error('Gagal mencatat pergerakan stok'); }
    finally { setIsSubmitting(false); }
  };

  const isWarehouseOrAbove = ['OWNER', 'CEO', 'GM', 'ADMIN'].includes(userRole) || userDivision === 'GUDANG';
  const lowStockItems = items.filter(i => i.currentStock <= i.minStock);
  const todayMovements = movements.filter(m => new Date(m.date).toDateString() === new Date().toDateString());

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  if (!loading && !isWarehouseOrAbove) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center gap-4">
        <AlertTriangle className="w-16 h-16 text-rose-500 opacity-50" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Akses Ditolak</h2>
          <p className="text-slate-500 mt-2">Anda tidak memiliki izin untuk melihat halaman Divisi Gudang.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Divisi Gudang</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manajemen stok barang, bahan baku, dan riwayat pergerakan gudang.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total Item Master</p>
              <p className="text-4xl font-bold mt-1">{items.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Package2 className="w-6 h-6" /></div>
          </div>
        </div>
        <div className={`rounded-2xl p-5 text-white shadow-lg ${lowStockItems.length > 0 ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200 dark:shadow-rose-900/30' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Warning Stok Tipis</p>
              <p className="text-4xl font-bold mt-1">{lowStockItems.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          {lowStockItems.length > 0 && <p className="text-rose-100 text-xs mt-2">{lowStockItems.map(i => i.name).join(', ')}</p>}
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium">Pergerakan Hari Ini</p>
              <p className="text-4xl font-bold mt-1">{todayMovements.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
        {(['stock', 'movements'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            {tab === 'stock' ? `📦 Stok Saat Ini (${lowStockItems.length} warning)` : '📋 Riwayat & Input'}
          </button>
        ))}
      </div>

      {/* TAB: STOK */}
      {activeTab === 'stock' && (
        <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Daftar Inventori Gudang</CardTitle>
            <CardDescription>Pemantauan jumlah stok fisik dan batas minimal</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Kode Item</th>
                  <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Nama Barang</th>
                  <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Stok Aktual</th>
                  <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Batas Min.</th>
                  <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Master barang masih kosong — hubungi Admin</td></tr>
                ) : items.map(i => (
                  <tr key={i.id} className={`transition-colors ${i.currentStock <= i.minStock ? 'bg-rose-50/30 dark:bg-rose-900/10 hover:bg-rose-50/50' : 'hover:bg-indigo-50/20 dark:hover:bg-slate-800/20'}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">{i.code}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{i.name}</td>
                    <td className={`px-6 py-4 text-right font-bold ${i.currentStock <= i.minStock ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
                      {i.currentStock.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">{i.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">
                      {i.minStock.toLocaleString('id-ID')} <span className="text-xs">{i.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      {i.currentStock <= i.minStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50">
                          <AlertTriangle className="w-3 h-3" /> Restock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                          ✓ Aman
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB: MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="grid gap-6 lg:grid-cols-5">
          {isWarehouseOrAbove && (
            <Card className="lg:col-span-2 glass-card border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-brand-primary" /> Input Pergerakan Stok
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Pilih Barang <span className="text-rose-500">*</span></Label>
                    <Select value={formData.warehouseItemId} onValueChange={v => setFormData({...formData, warehouseItemId: v || ''})}>
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <SelectValue placeholder="Pilih barang..." />
                      </SelectTrigger>
                      <SelectContent>
                        {items.length === 0 && <SelectItem value="none" disabled>Tidak ada data barang</SelectItem>}
                        {items.map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.name} ({i.currentStock} {i.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Jenis Pergerakan <span className="text-rose-500">*</span></Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ val: 'IN', label: 'Stok MASUK', color: 'emerald' }, { val: 'OUT', label: 'Stok KELUAR', color: 'rose' }].map(({ val, label, color }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData({...formData, type: val})}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                            formData.type === val
                              ? color === 'emerald'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {val === 'IN' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                          {label.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Jumlah (Qty) <span className="text-rose-500">*</span></Label>
                    <Input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-600 dark:text-slate-300">Keterangan <span className="text-slate-400 font-normal text-xs">(Opsional)</span></Label>
                    <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Misal: Retur barang / Dipakai produksi" className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-visible:ring-brand-primary" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pergerakan'}
                  </button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card className={`${isWarehouseOrAbove ? 'lg:col-span-3' : 'lg:col-span-5'} glass-card border-0 shadow-md rounded-2xl overflow-hidden`}>
            <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Buku Catatan Gudang</CardTitle>
              <CardDescription>Riwayat semua pergerakan stok masuk dan keluar</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Tanggal</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Barang</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center">Tipe</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Qty</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {movements.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Belum ada riwayat pergerakan gudang</td></tr>
                  ) : movements.map(m => (
                    <tr key={m.id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">{format(new Date(m.date), 'dd MMM yyyy HH:mm', { locale: localeId })}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{m.item.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          m.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                            : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'
                        }`}>
                          {m.type === 'IN' ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {m.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold font-mono ${m.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.type === 'IN' ? '+' : '-'}{m.quantity.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{m.notes || '—'}</td>
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
