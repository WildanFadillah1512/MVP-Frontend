'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api/axios';
import { Plus, Send, CheckCircle, XCircle, ShoppingCart, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface PurchaseRequestItem {
  id: string;
  warehouseItemId: string;
  item: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
  requestedQty: number;
  estimatedBudget?: number;
  actualPrice?: number;
  actualQty?: number;
  supplierId?: string;
  supplier?: {
    name: string;
  };
}

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  items: PurchaseRequestItem[];
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

  // Bulk Approval State
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

  // Create Form State
  const [formData, setFormData] = useState({
    items: [{ warehouseItemId: '', requestedQty: '' }],
    priority: 'MEDIUM',
    notes: ''
  });

  // Price Form State (Array of item prices)
  const [priceData, setPriceData] = useState<any[]>([]);

  // Purchased Form State (Array of purchased items)
  const [purchasedData, setPurchasedData] = useState<any[]>([]);
  const [receiptUrl, setReceiptUrl] = useState('');

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // filter valid items
    const validItems = formData.items.filter(i => i.warehouseItemId && i.requestedQty);
    if (validItems.length === 0) {
      toast.error("Minimal 1 barang diisi!");
      return;
    }

    try {
      await api.post('/purchase-requests', {
        items: validItems,
        priority: formData.priority,
        notes: formData.notes
      });
      toast.success('Purchase request berhasil dibuat');
      setShowDialog(false);
      resetForm();
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat request');
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { warehouseItemId: '', requestedQty: '' }]
    });
  };
  
  const removeItemRow = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItemRow = (index: number, field: string, value: string) => {
    const newItems = [...formData.items] as any;
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
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
        updatedItems: priceData
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

  const handleBulkApprove = async () => {
    if (selectedRequestIds.length === 0) return;
    
    try {
      // Loop over selected and approve based on role
      for (const id of selectedRequestIds) {
        if (canManagerApprove) {
           await api.patch(`/purchase-requests/${id}/manager-approve`);
        } else if (canCeoApprove) {
           await api.patch(`/purchase-requests/${id}/ceo-approve`);
        }
      }
      toast.success(`${selectedRequestIds.length} request disetujui secara massal`);
      setSelectedRequestIds([]);
      fetchRequests();
    } catch (error: any) {
      toast.error('Gagal melakukan bulk approve');
    }
  };

  const approvableRequests = requests.filter(r => 
    (canManagerApprove && r.status === 'PENDING_MANAGER') || 
    (canCeoApprove && r.status === 'PENDING_CEO')
  );

  const toggleSelectAll = () => {
    if (selectedRequestIds.length === approvableRequests.length) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(approvableRequests.map(r => r.id));
    }
  };

  const toggleSelectRequest = (id: string) => {
    if (selectedRequestIds.includes(id)) {
      setSelectedRequestIds(selectedRequestIds.filter(rid => rid !== id));
    } else {
      setSelectedRequestIds([...selectedRequestIds, id]);
    }
  };

  const handleMarkPurchased = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await api.patch(`/purchase-requests/${selectedRequest.id}/purchased`, {
        purchasedItems: purchasedData,
        receiptUrl: receiptUrl
      });
      toast.success('Pembelian selesai, stok gudang bertambah');
      setShowPurchasedDialog(false);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menandai purchased');
    }
  };

  const openPriceDialog = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setPriceData(request.items.map(item => ({
      id: item.id,
      supplierId: item.supplierId || '',
      estimatedBudget: item.estimatedBudget || '',
      actualPrice: item.actualPrice || ''
    })));
    setShowPriceDialog(true);
  };

  const openPurchasedDialog = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setPurchasedData(request.items.map(item => ({
      id: item.id,
      actualQty: item.requestedQty,
      actualPrice: item.actualPrice || ''
    })));
    setReceiptUrl('');
    setShowPurchasedDialog(true);
  };

  const resetForm = () => {
    setFormData({
      items: [{ warehouseItemId: '', requestedQty: '' }],
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
        <div className="space-x-2 flex">
          {(canManagerApprove || canCeoApprove) && approvableRequests.length > 0 && (
             <Button variant="secondary" onClick={toggleSelectAll}>
               {selectedRequestIds.length === approvableRequests.length ? 'Deselect All' : 'Select All'}
             </Button>
          )}
          {(canManagerApprove || canCeoApprove) && selectedRequestIds.length > 0 && (
             <Button onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700">
               <CheckCircle className="mr-2 h-4 w-4" /> Approve Selected ({selectedRequestIds.length})
             </Button>
          )}
          {canCreateRequest && (
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Buat Request
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => {
          const isApprovable = (canManagerApprove && request.status === 'PENDING_MANAGER') || (canCeoApprove && request.status === 'PENDING_CEO');
          
          return (
          <Card key={request.id}>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex justify-between items-center text-lg">
                <div className="flex items-center space-x-3">
                  {isApprovable && (
                     <Checkbox 
                        checked={selectedRequestIds.includes(request.id)}
                        onCheckedChange={() => toggleSelectRequest(request.id)}
                     />
                  )}
                  <span className="font-bold">{request.requestNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
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
            <CardContent className="pt-4">
               {/* Daftar Barang */}
               <div className="space-y-3">
                 {request.items?.map((item, idx) => (
                   <div key={item.id || idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-gray-50 p-2 rounded text-sm">
                      <div>
                        <p className="font-semibold">{item.item?.name}</p>
                        <p className="text-gray-500">Jml: {item.requestedQty} {item.item?.unit}</p>
                      </div>
                      <div>
                        {item.supplier && <p>Supplier: {item.supplier.name}</p>}
                        {item.estimatedBudget && <p className="text-gray-500">Est. Budget: Rp {item.estimatedBudget.toLocaleString()}</p>}
                      </div>
                      <div>
                        {item.actualPrice && <p className="font-medium text-green-600">Harga: Rp {item.actualPrice.toLocaleString()}</p>}
                        {item.actualQty && <p className="text-gray-500">Dibeli: {item.actualQty} {item.item?.unit}</p>}
                      </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Create Request Dialog (Multi-Barang) */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Purchase Request</DialogTitle>
            <DialogDescription>Tambahkan satu atau lebih barang dalam request ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            
            <div className="space-y-3">
              <Label>Daftar Barang</Label>
              {formData.items.map((item, index) => (
                 <div key={index} className="flex space-x-2 items-center bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <select
                        className="w-full border rounded p-2 text-sm"
                        value={item.warehouseItemId}
                        onChange={(e) => updateItemRow(index, 'warehouseItemId', e.target.value)}
                        required
                      >
                        <option value="">Pilih Barang...</option>
                        {warehouseItems.map((wItem) => (
                          <option key={wItem.id} value={wItem.id}>
                            {wItem.name} ({wItem.code}) - {wItem.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number" step="any" placeholder="Qty"
                        value={item.requestedQty}
                        onChange={(e) => updateItemRow(index, 'requestedQty', e.target.value)}
                        required
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItemRow(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                 </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                <Plus className="mr-1 h-3 w-3" /> Tambah Barang
              </Button>
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
              <Label>Catatan Umum</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Price Dialog (Per-Item) */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Harga & Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetPrice} className="space-y-6">
            
            {selectedRequest?.items.map((item, index) => (
               <div key={item.id} className="border p-3 rounded space-y-3">
                 <p className="font-semibold text-blue-800">{item.item.name} - Qty: {item.requestedQty} {item.item.unit}</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Supplier</Label>
                      <select
                        className="w-full border rounded p-2 text-sm"
                        value={priceData[index]?.supplierId || ''}
                        onChange={(e) => {
                           const newPd = [...priceData];
                           newPd[index].supplierId = e.target.value;
                           setPriceData(newPd);
                        }}
                      >
                        <option value="">Pilih...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Estimasi Budget</Label>
                      <Input
                        type="number" step="any" className="h-9"
                        value={priceData[index]?.estimatedBudget || ''}
                        onChange={(e) => {
                           const newPd = [...priceData];
                           newPd[index].estimatedBudget = e.target.value;
                           setPriceData(newPd);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Harga Aktual (Deal)</Label>
                      <Input
                        type="number" step="any" className="h-9"
                        value={priceData[index]?.actualPrice || ''}
                        onChange={(e) => {
                           const newPd = [...priceData];
                           newPd[index].actualPrice = e.target.value;
                           setPriceData(newPd);
                        }}
                      />
                    </div>
                 </div>
               </div>
            ))}
            
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tandai Sudah Dibeli</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMarkPurchased} className="space-y-4">
            
            <div className="space-y-3">
              {selectedRequest?.items.map((item, index) => (
                 <div key={item.id} className="border p-2 rounded grid grid-cols-2 gap-2 bg-gray-50">
                    <div className="col-span-2 font-semibold text-sm">
                      {item.item.name} 
                    </div>
                    <div>
                      <Label className="text-xs">Jumlah Dibeli ({item.item.unit})</Label>
                      <Input
                        type="number" step="any" className="h-8 text-sm"
                        value={purchasedData[index]?.actualQty || ''}
                        onChange={(e) => {
                           const newPd = [...purchasedData];
                           newPd[index].actualQty = e.target.value;
                           setPurchasedData(newPd);
                        }}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Harga Final/Total</Label>
                      <Input
                        type="number" step="any" className="h-8 text-sm"
                        value={purchasedData[index]?.actualPrice || ''}
                        onChange={(e) => {
                           const newPd = [...purchasedData];
                           newPd[index].actualPrice = e.target.value;
                           setPurchasedData(newPd);
                        }}
                        required
                      />
                    </div>
                 </div>
              ))}
            </div>

            <div>
              <Label>URL Bukti/Nota Umum (Opsional)</Label>
              <Input
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPurchasedDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan ke Gudang</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
