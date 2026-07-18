'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api/axios';
import { Plus, Send, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requestedQty: number;
  estimatedBudget?: number;
  actualPrice?: number;
  status: string;
  priority: string;
  item: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
  supplier?: {
    name: string;
  };
}

export default function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierPrices, setSupplierPrices] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showPurchasedDialog, setShowPurchasedDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  const [formData, setFormData] = useState({
    warehouseItemId: '',
    requestedQty: '',
    priority: 'MEDIUM',
    notes: ''
  });

  const [priceData, setPriceData] = useState({
    supplierId: '',
    estimatedBudget: '',
    actualPrice: ''
  });

  const [purchasedData, setPurchasedData] = useState({
    actualQty: '',
    actualPrice: '',
    receiptUrl: ''
  });

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    fetchRequests();
    fetchWarehouseItems();
    fetchSuppliers();
  }, []);

  const userRole = currentUser?.role?.name || '';
  const userDivision = currentUser?.division?.name || '';
  const isTopLevel = ['OWNER', 'CEO', 'GM', 'ADMIN'].includes(userRole);
  const canCreateRequest = isTopLevel || userDivision === 'GUDANG';
  const canSetPrice = userRole === 'STAFF' && userDivision === 'PURCHASING';
  const canManagerApprove = userRole === 'MANAGER' && userDivision === 'PURCHASING';
  const canCeoApprove = ['CEO', 'OWNER'].includes(userRole);
  const canMarkPurchased = isTopLevel || userDivision === 'PURCHASING';

  async function fetchRequests() {
    try {
      const response = await api.get('/purchase-requests');
      setRequests(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchWarehouseItems() {
    try {
      const response = await api.get('/warehouse/items');
      setWarehouseItems(response.data.data);
    } catch (error) {
      console.error('Failed to fetch warehouse items:', error);
    }
  }

  async function fetchSuppliers() {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data.filter((s: any) => s.approvedAt));
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  }

  async function fetchSupplierPrices(warehouseItemId: string) {
    try {
      const response = await api.get(`/purchase-requests/suppliers/${warehouseItemId}`);
      setSupplierPrices(response.data.data);
    } catch (error) {
      console.error('Failed to fetch supplier prices:', error);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/purchase-requests', {
        ...formData,
        requestedQty: Number(formData.requestedQty)
      });
      toast.success('Purchase request berhasil dibuat');
      setShowDialog(false);
      resetForm();
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat request');
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await api.patch(`/purchase-requests/${id}/submit`);
      toast.success('Request disubmit ke Purchasing');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal submit request');
    }
  };

  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await api.patch(`/purchase-requests/${selectedRequest.id}/set-price`, {
        ...priceData,
        estimatedBudget: Number(priceData.estimatedBudget),
        actualPrice: Number(priceData.actualPrice)
      });
      toast.success('Harga dan supplier berhasil diset');
      setShowPriceDialog(false);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal set harga');
    }
  };

  const handleManagerApprove = async (id: string) => {
    try {
      await api.patch(`/purchase-requests/${id}/manager-approve`);
      toast.success('Request disetujui oleh Manager');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal approve');
    }
  };

  const handleCeoApprove = async (id: string) => {
    try {
      await api.patch(`/purchase-requests/${id}/ceo-approve`);
      toast.success('Request disetujui oleh CEO');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal approve');
    }
  };

  const handleMarkPurchased = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await api.patch(`/purchase-requests/${selectedRequest.id}/purchased`, {
        actualQty: Number(purchasedData.actualQty),
        actualPrice: Number(purchasedData.actualPrice),
        receiptUrl: purchasedData.receiptUrl
      });
      toast.success('Pembelian selesai, stok gudang bertambah');
      setShowPurchasedDialog(false);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menandai purchased');
    }
  };

  const openPriceDialog = async (request: PurchaseRequest) => {
    setSelectedRequest(request);
    await fetchSupplierPrices(request.item.id);
    setShowPriceDialog(true);
  };

  const openPurchasedDialog = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setPurchasedData({
      actualQty: String(request.requestedQty),
      actualPrice: String(request.actualPrice || ''),
      receiptUrl: ''
    });
    setShowPurchasedDialog(true);
  };

  const resetForm = () => {
    setFormData({
      warehouseItemId: '',
      requestedQty: '',
      priority: 'MEDIUM',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SUBMITTED_BY_WAREHOUSE': 'bg-blue-100 text-blue-800',
      'PENDING_STAFF_PRICE': 'bg-yellow-100 text-yellow-800',
      'PENDING_MANAGER': 'bg-orange-100 text-orange-800',
      'PENDING_CEO': 'bg-purple-100 text-purple-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'PURCHASED': 'bg-green-600 text-white',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Requests</h1>
        {canCreateRequest && (
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Buat Request
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div>
                  <span className="text-lg">{request.requestNumber}</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                  <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                    {request.priority}
                  </span>
                </div>
                <div className="space-x-2">
                  {request.status === 'DRAFT' && canCreateRequest && (
                    <Button size="sm" onClick={() => handleSubmit(request.id)}>
                      <Send className="h-4 w-4 mr-1" /> Submit
                    </Button>
                  )}
                  {request.status === 'SUBMITTED_BY_WAREHOUSE' && canSetPrice && (
                    <Button size="sm" onClick={() => openPriceDialog(request)}>
                      Set Harga & Supplier
                    </Button>
                  )}
                  {request.status === 'PENDING_MANAGER' && canManagerApprove && (
                    <Button size="sm" onClick={() => handleManagerApprove(request.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve (Manager)
                    </Button>
                  )}
                  {request.status === 'PENDING_CEO' && canCeoApprove && (
                    <Button size="sm" onClick={() => handleCeoApprove(request.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve (CEO)
                    </Button>
                  )}
                  {request.status === 'APPROVED' && canMarkPurchased && (
                    <Button size="sm" onClick={() => openPurchasedDialog(request)}>
                      <ShoppingCart className="h-4 w-4 mr-1" /> Mark Purchased
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Item: {request.item.name}</p>
                  <p className="text-sm text-gray-600">Jumlah: {request.requestedQty} {request.item.unit}</p>
                </div>
                <div>
                  {request.supplier && (
                    <p className="text-sm text-gray-600">Supplier: {request.supplier.name}</p>
                  )}
                  {request.estimatedBudget && (
                    <p className="text-sm text-gray-600">
                      Budget: Rp {request.estimatedBudget.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  {request.actualPrice && (
                    <p className="text-sm text-gray-600">
                      Harga Aktual: Rp {request.actualPrice.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Request Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Purchase Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Barang</Label>
              <select
                className="w-full border rounded p-2"
                value={formData.warehouseItemId}
                onChange={(e) => setFormData({ ...formData, warehouseItemId: e.target.value })}
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
              <Label>Jumlah</Label>
              <Input
                type="number"
                value={formData.requestedQty}
                onChange={(e) => setFormData({ ...formData, requestedQty: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Prioritas</Label>
              <select
                className="w-full border rounded p-2"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <Label>Catatan</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
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

      {/* Set Price Dialog */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Harga & Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetPrice} className="space-y-4">
            {supplierPrices.length > 0 && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm font-semibold mb-2">Opsi Supplier:</p>
                {supplierPrices.map((sp) => (
                  <div key={sp.id} className="text-sm">
                    {sp.supplier.name}: Rp {sp.unitPrice.toLocaleString()} per {sp.item.unit}
                  </div>
                ))}
              </div>
            )}
            <div>
              <Label>Supplier</Label>
              <select
                className="w-full border rounded p-2"
                value={priceData.supplierId}
                onChange={(e) => setPriceData({ ...priceData, supplierId: e.target.value })}
                required
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Estimasi Budget</Label>
              <Input
                type="number"
                value={priceData.estimatedBudget}
                onChange={(e) => setPriceData({ ...priceData, estimatedBudget: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Harga Aktual</Label>
              <Input
                type="number"
                value={priceData.actualPrice}
                onChange={(e) => setPriceData({ ...priceData, actualPrice: e.target.value })}
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

      {/* Mark Purchased Dialog */}
      <Dialog open={showPurchasedDialog} onOpenChange={setShowPurchasedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tandai Sudah Dibeli</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMarkPurchased} className="space-y-4">
            <div>
              <Label>Jumlah Dibeli</Label>
              <Input
                type="number"
                value={purchasedData.actualQty}
                onChange={(e) => setPurchasedData({ ...purchasedData, actualQty: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Harga Final</Label>
              <Input
                type="number"
                value={purchasedData.actualPrice}
                onChange={(e) => setPurchasedData({ ...purchasedData, actualPrice: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>URL Bukti/Nota</Label>
              <Input
                value={purchasedData.receiptUrl}
                onChange={(e) => setPurchasedData({ ...purchasedData, receiptUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowPurchasedDialog(false)}>
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
