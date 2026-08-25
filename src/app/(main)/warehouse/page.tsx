"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { warehouseApi } from '@/features/warehouse/api/warehouse.api';
import { Box, Plus, Minus, ArrowLeftRight, AlertTriangle, Package2, Activity, Trash2, Pencil, X } from "lucide-react";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export default function WarehousePage() {
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userDivision, setUserDivision] = useState('');
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [editingItemId, setEditingItemId] = useState('');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [formData, setFormData] = useState({ warehouseItemId: '', type: 'IN', quantity: '', notes: '' });
  const [itemForm, setItemForm] = useState({
    code: '',
    name: '',
    category: '',
    minStock: '',
    maxStock: '',
    currentStock: '',
    unit: 'gram',
    purchasePrice: '',
    purchaseGram: ''
  });

  const fetchData = async () => {
    try {
      const itemRes = await warehouseApi.getItems();
      if (itemRes.success) setItems(itemRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchMovements = async () => {
    try {
      const params: any = {};
      if (dateRange?.from) params.startDate = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) params.endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      const res = await warehouseApi.getMovements(params);
      if (res.success) setMovements(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [dateRange]);

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
        fetchMovements();
      }
    } catch { toast.error('Gagal mencatat pergerakan stok'); }
    finally { setIsSubmitting(false); }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name) {
      toast.error('Nama barang wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = editingItemId
        ? await warehouseApi.updateItem(editingItemId, itemForm)
        : await warehouseApi.createItem(itemForm);
      if (res.success) {
        toast.success(editingItemId ? 'Master barang berhasil diperbarui' : 'Master barang berhasil dibuat');
        resetItemForm();
        setIsItemDialogOpen(false);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal membuat master barang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetItemForm = () => {
    setEditingItemId('');
    setItemForm({ code: '', name: '', category: '', minStock: '', maxStock: '', currentStock: '', unit: 'gram', purchasePrice: '', purchaseGram: '' });
  };

  const startEditItem = (item: any) => {
    setEditingItemId(item.id);
    setItemForm({
      code: item.code || '',
      name: item.name || '',
      category: item.category || '',
      minStock: String(item.minStock ?? ''),
      maxStock: String(item.maxStock ?? ''),
      currentStock: String(item.currentStock ?? ''),
      unit: item.unit || 'gram',
      purchasePrice: String(item.purchasePrice ?? ''),
      purchaseGram: String(item.purchaseGram ?? '')
    });
    setIsItemDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Hapus ${itemName} dari daftar barang aktif? Riwayat stok tetap tersimpan.`)) return;
    setIsSubmitting(true);
    try {
      const res = await warehouseApi.deleteItem(itemId);
      if (res.success) {
        toast.success('Barang gudang berhasil dihapus');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus barang gudang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWarehouseOrAbove = ['OWNER', 'CEO', 'GM', 'ADMIN'].includes(userRole) || ['GUDANG', 'PURCHASING'].includes(userDivision);
  const canSetupItem = ['OWNER', 'CEO'].includes(userRole);
  const canDeleteItem = userRole === 'CEO' || userDivision === 'PURCHASING';
  const lowStockItems = items.filter(i => i.currentStock <= i.minStock);
  const todayMovements = movements.filter(m => new Date(m.date).toDateString() === new Date().toDateString());
  const previewPricePerGram = Number(itemForm.purchasePrice || 0) > 0 && Number(itemForm.purchaseGram || 0) > 0
    ? Number(itemForm.purchasePrice) / Number(itemForm.purchaseGram)
    : 0;

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!loading && !isWarehouseOrAbove) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center gap-4">
        <AlertTriangle className="w-16 h-16 text-rose-500 opacity-50" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Akses Ditolak</h2>
          <p className="text-muted-foreground mt-2">Anda tidak memiliki izin untuk melihat halaman Divisi Gudang.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Divisi Gudang</h1>
        <p className="text-muted-foreground mt-1">Manajemen stok barang, bahan baku, dan riwayat pergerakan gudang.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Item Master</p>
              <p className="text-4xl font-black text-foreground mt-1">{items.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Package2 className="w-6 h-6" /></div>
          </div>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ${lowStockItems.length > 0 ? 'bg-card border border-border shadow-sm' : 'bg-card border border-border shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Warning Stok Tipis</p>
              <p className="text-4xl font-black text-foreground mt-1">{lowStockItems.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          {lowStockItems.length > 0 && <p className="text-muted-foreground text-xs mt-2">{lowStockItems.map(i => i.name).join(', ')}</p>}
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Pergerakan Hari Ini</p>
              <p className="text-4xl font-black text-foreground mt-1">{todayMovements.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl w-fit">
          {(['stock', 'movements'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab === 'stock' ? `📦 Stok Saat Ini (${lowStockItems.length} warning)` : '🔄 Riwayat & Input'}
            </button>
          ))}
        </div>
        
        {canSetupItem && (
          <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
            setIsItemDialogOpen(open);
            if (!open) resetItemForm();
          }}>
            <DialogTrigger render={
              <Button className="rounded-xl font-bold h-10">
                <Plus className="w-4 h-4 mr-2" /> Tambah Barang
              </Button>
            } />
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingItemId ? 'Edit Master Barang' : 'Setup Master Barang'}</DialogTitle>
                <DialogDescription>Tambahkan bahan baku dengan nama saja, lalu lengkapi harga dan gram bila sudah ada.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateItem} className="grid gap-4 mt-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nama Bahan/Barang</Label>
                  <Input value={itemForm.name} onChange={(e) => setItemForm({...itemForm, name: e.target.value})} placeholder="Misal: Biji Kopi Arabika" />
                </div>
                <div className="space-y-2">
                  <Label>Kode (Opsional)</Label>
                  <Input value={itemForm.code} onChange={(e) => setItemForm({...itemForm, code: e.target.value})} placeholder="Misal: KOP-01" />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Input value={itemForm.category} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} placeholder="Kategori" />
                </div>
                <div className="space-y-2">
                  <Label>Unit Kemasan</Label>
                  <Input value={itemForm.unit} onChange={(e) => setItemForm({...itemForm, unit: e.target.value})} placeholder="Misal: gram, pcs, kg" />
                </div>
                <div className="space-y-2">
                  <Label>Batas Min. Stok</Label>
                  <Input type="number" step="any" min="0" value={itemForm.minStock} onChange={(e) => setItemForm({...itemForm, minStock: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Batas Max. Stok (Opsional)</Label>
                  <Input type="number" step="any" min="0" value={itemForm.maxStock} onChange={(e) => setItemForm({...itemForm, maxStock: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Stok Awal</Label>
                  <Input type="number" step="any" min="0" value={itemForm.currentStock} onChange={(e) => setItemForm({...itemForm, currentStock: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2 mt-4 pt-4 border-t border-border">
                  <Label className="text-primary font-bold">Pengaturan Harga Modal</Label>
                </div>
                <div className="space-y-2">
                  <Label>Total Harga Beli (Rp)</Label>
                  <Input type="number" step="any" min="0" value={itemForm.purchasePrice} onChange={(e) => setItemForm({...itemForm, purchasePrice: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Total Gram (Isi)</Label>
                  <Input type="number" step="any" min="0" value={itemForm.purchaseGram} onChange={(e) => setItemForm({...itemForm, purchaseGram: e.target.value})} />
                </div>
                <div className="md:col-span-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground text-center">
                  Harga Satuan Terhitung: <span className="text-primary">Rp {previewPricePerGram.toLocaleString('id-ID', { maximumFractionDigits: 2 })} / gram</span>
                </div>
                <DialogFooter className="md:col-span-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : editingItemId ? 'Update Barang' : 'Simpan Barang'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* TAB: STOK */}
      {activeTab === 'stock' && (
        <Card className="border-border shadow-md rounded-2xl overflow-hidden mt-4">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground">Daftar Inventori Gudang</CardTitle>
            <CardDescription>Pemantauan jumlah stok fisik dan batas minimal</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-foreground">Kode Item</th>
                  <th className="px-6 py-3 font-semibold text-foreground">Nama Barang</th>
                  <th className="px-6 py-3 font-semibold text-foreground text-right">Stok Aktual</th>
                  <th className="px-6 py-3 font-semibold text-foreground text-right">Batas Min.</th>
                  <th className="px-6 py-3 font-semibold text-foreground text-right">Batas Max.</th>
                  <th className="px-6 py-3 font-semibold text-foreground text-right">Harga/Gram</th>
                  <th className="px-6 py-3 font-semibold text-foreground">Status</th>
                  {(canSetupItem || canDeleteItem) && <th className="px-6 py-3 font-semibold text-foreground text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={(canSetupItem || canDeleteItem) ? 7 : 6} className="px-6 py-12 text-center text-muted-foreground">
                      Master barang masih kosong - hubungi Admin
                    </td>
                  </tr>
                ) : items.map(i => (
                  <tr key={i.id} className={`transition-colors ${i.currentStock <= i.minStock ? 'bg-rose-50/30 dark:bg-rose-900/10 hover:bg-rose-50/50' : 'hover:bg-muted/50'}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-muted/50 dark:bg-primary/10 text-primary dark:text-primary px-2 py-0.5 rounded">{i.code}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{i.name}</td>
                    <td className={`px-6 py-4 text-right font-bold ${i.currentStock <= i.minStock ? 'text-rose-600' : 'text-foreground'}`}>
                      {i.currentStock.toLocaleString('id-ID')} <span className="text-xs font-normal text-muted-foreground">{i.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {i.minStock.toLocaleString('id-ID')} <span className="text-xs">{i.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {i.maxStock ? i.maxStock.toLocaleString('id-ID') : '-'} <span className="text-xs">{i.maxStock ? i.unit : ''}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      Rp {Number(i.pricePerGram || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {i.currentStock <= i.minStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50">
                          <AlertTriangle className="w-3 h-3" /> Restock
                        </span>
                      ) : (i.maxStock && i.currentStock >= i.maxStock) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50">
                          <AlertTriangle className="w-3 h-3" /> Overstock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                          Aman
                        </span>
                      )}
                    </td>
                    {(canSetupItem || canDeleteItem) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {canSetupItem && (
                            <button
                              type="button"
                              onClick={() => startEditItem(i)}
                              disabled={isSubmitting}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                              title="Edit barang"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDeleteItem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(i.id, i.name)}
                              disabled={isSubmitting}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                              title="Hapus barang"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
            <Card className="lg:col-span-2 border-border shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-card/50 border-b border-border p-6">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-primary" /> Input Pergerakan Stok
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">Pilih Barang <span className="text-rose-500">*</span></Label>
                    <Select value={formData.warehouseItemId} onValueChange={v => setFormData({...formData, warehouseItemId: v || ''})}>
                      <SelectTrigger className="rounded-xl border-border bg-muted/30 overflow-hidden">
                        <SelectValue placeholder="Pilih barang...">
                          {formData.warehouseItemId ? items.find(i => i.id === formData.warehouseItemId)?.name : "Pilih barang..."}
                        </SelectValue>
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
                    <Label className="font-medium text-foreground">Jenis Pergerakan <span className="text-rose-500">*</span></Label>
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
                              : 'border-border text-muted-foreground hover:border-slate-300'
                          }`}
                        >
                          {val === 'IN' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                          {label.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">Jumlah (Qty) <span className="text-rose-500">*</span></Label>
                    <Input type="number" step="any" required min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">Keterangan <span className="text-muted-foreground font-normal text-xs">(Opsional)</span></Label>
                    <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Misal: Retur barang / Dipakai produksi" className="rounded-xl border-border bg-muted/30  focus-visible:ring-primary" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors shadow-md disabled:opacity-50">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pergerakan'}
                  </button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card className={`${isWarehouseOrAbove ? 'lg:col-span-3' : 'lg:col-span-5'} border-border shadow-md rounded-2xl overflow-hidden`}>
            <CardHeader className="bg-card/50 border-b border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Buku Catatan Gudang</CardTitle>
                <CardDescription>Riwayat semua pergerakan stok masuk dan keluar</CardDescription>
              </div>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-foreground">Tanggal</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Barang</th>
                    <th className="px-6 py-3 font-semibold text-foreground text-center">Tipe</th>
                    <th className="px-6 py-3 font-semibold text-foreground text-right">Qty</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {movements.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Belum ada riwayat pergerakan gudang</td></tr>
                  ) : movements.map(m => (
                    <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">{format(new Date(m.date), 'dd MMM yyyy HH:mm', { locale: localeId })}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{m.item.name}</td>
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
                      <td className="px-6 py-4 text-muted-foreground">{m.notes || '-'}</td>
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
