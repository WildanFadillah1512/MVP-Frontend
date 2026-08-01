'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api/axios';
import { Plus, Edit, CheckCircle, Trash2 } from 'lucide-react';

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  approvedAt?: string;
  supplierPrices: any[];
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: ''
  });

  const [priceData, setPriceData] = useState({
    supplierId: '',
    warehouseItemId: '',
    unitPrice: ''
  });

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    fetchSuppliers();
    fetchWarehouseItems();
  }, []);

  const userRole = currentUser?.role?.name || '';
  const canManageSupplier = ['MANAGER', 'CEO', 'OWNER', 'GM'].includes(userRole);
  const canSetSupplierPrice = ['CEO', 'OWNER'].includes(userRole);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengambil data supplier');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseItems = async () => {
    try {
      const response = await api.get('/warehouse/items');
      setWarehouseItems(response.data.data);
    } catch (error) {
      console.error('Failed to fetch warehouse items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editSupplier) {
        await api.put(`/suppliers/${editSupplier.id}`, formData);
        toast.success('Supplier berhasil diupdate');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier berhasil ditambahkan');
      }
      setShowDialog(false);
      resetForm();
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan supplier');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/suppliers/${id}/approve`);
      toast.success('Supplier berhasil disetujui');
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyetujui supplier');
    }
  };

  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/suppliers/prices', priceData);
      toast.success('Harga supplier berhasil diset');
      setShowPriceDialog(false);
      setPriceData({ supplierId: '', warehouseItemId: '', unitPrice: '' });
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengset harga');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: ''
    });
    setEditSupplier(null);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setFormData({
      code: supplier.code,
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setShowDialog(true);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Supplier Management</h1>
        <div className="space-x-2">
          {canManageSupplier && (
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Supplier
            </Button>
          )}
          {canSetSupplierPrice && (
            <Button variant="outline" onClick={() => setShowPriceDialog(true)}>
              Set Harga
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div>
                  <span className="text-lg">{supplier.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({supplier.code})</span>
                  {supplier.approvedAt && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Approved
                    </span>
                  )}
                </div>
                <div className="space-x-2">
                  {!supplier.approvedAt && canManageSupplier && (
                    <Button size="sm" onClick={() => handleApprove(supplier.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  {canManageSupplier && (
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Kontak: {supplier.contactName || '-'}</p>
                  <p className="text-sm text-gray-600">Telepon: {supplier.phone || '-'}</p>
                  <p className="text-sm text-gray-600">Email: {supplier.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alamat: {supplier.address || '-'}</p>
                  {supplier.supplierPrices.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold">Harga Items:</p>
                      {supplier.supplierPrices.map((price: any) => (
                        <p key={price.id} className="text-sm text-gray-600">
                          {price.item.name}: Rp {price.unitPrice.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Kode Supplier</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Nama Supplier</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Nama Kontak</Label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div>
                <Label>Telepon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Alamat</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Price Dialog (CEO Only) */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Harga Supplier (CEO Only)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetPrice} className="space-y-4">
            <div>
              <Label>Supplier</Label>
              <select
                className="w-full border rounded p-2"
                value={priceData.supplierId}
                onChange={(e) => setPriceData({ ...priceData, supplierId: e.target.value })}
                required
              >
                <option value="">Pilih Supplier</option>
                {suppliers.filter(s => s.approvedAt).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Barang</Label>
              <select
                className="w-full border rounded p-2"
                value={priceData.warehouseItemId}
                onChange={(e) => setPriceData({ ...priceData, warehouseItemId: e.target.value })}
                required
              >
                <option value="">Pilih Barang</option>
                {warehouseItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Harga per Unit</Label>
              <Input
                type="number"
                value={priceData.unitPrice}
                onChange={(e) => setPriceData({ ...priceData, unitPrice: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowPriceDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
