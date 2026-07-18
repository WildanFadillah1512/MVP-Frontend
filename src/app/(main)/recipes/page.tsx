'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api/axios';
import { Plus, Trash2, Calculator, Play } from 'lucide-react';

interface Recipe {
  product: {
    id: string;
    name: string;
    code: string;
    recipeOutputQty: number;
  };
  ingredients: Array<{
    id: string;
    ingredient: {
      id: string;
      name: string;
      unit: string;
      currentStock: number;
    };
    qtyNeeded: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalRecipeCost: number;
  costPerOutput: number;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showCalcDialog, setShowCalcDialog] = useState(false);
  const [showProduceDialog, setShowProduceDialog] = useState(false);
  const [calculation, setCalculation] = useState<any>(null);

  const [formData, setFormData] = useState({
    productId: '',
    outputQtyPerBatch: '1',
    ingredients: [{ warehouseItemId: '', qtyNeeded: '', unitPrice: '' }]
  });

  const [calcData, setCalcData] = useState({
    productId: '',
    batchCount: ''
  });

  const [produceData, setProduceData] = useState({
    productId: '',
    batchCount: '',
    date: '',
    notes: ''
  });

  useEffect(() => {
    fetchRecipes();
    fetchProducts();
    fetchWarehouseItems();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengambil data resep');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/production/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
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

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { warehouseItemId: '', qtyNeeded: '', unitPrice: '' }]
    });
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleIngredientChange = (index: number, field: string, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/recipes/bulk', {
        productId: formData.productId,
        outputQtyPerBatch: Number(formData.outputQtyPerBatch),
        ingredients: formData.ingredients.map(ing => ({
          warehouseItemId: ing.warehouseItemId,
          qtyNeeded: Number(ing.qtyNeeded),
          unitPrice: Number(ing.unitPrice || 0)
        }))
      });
      toast.success('Resep berhasil disimpan');
      setShowDialog(false);
      resetForm();
      fetchRecipes();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan resep');
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.get('/recipes/calculate', {
        params: {
          productId: calcData.productId,
          batchCount: calcData.batchCount
        }
      });
      setCalculation(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghitung');
    }
  };

  const handleProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/recipes/produce', {
        ...produceData,
        batchCount: Number(produceData.batchCount)
      });
      toast.success('Produksi berhasil! Bahan otomatis berkurang, stok produk bertambah');
      setShowProduceDialog(false);
      resetProduceForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal produksi');
    }
  };

  const handleDeleteIngredient = async (recipeId: string) => {
    if (!confirm('Hapus bahan dari resep?')) return;
    try {
      await api.delete(`/recipes/${recipeId}`);
      toast.success('Bahan dihapus dari resep');
      fetchRecipes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      outputQtyPerBatch: '1',
      ingredients: [{ warehouseItemId: '', qtyNeeded: '', unitPrice: '' }]
    });
  };

  const resetProduceForm = () => {
    setProduceData({
      productId: '',
      batchCount: '',
      date: '',
      notes: ''
    });
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Resep Produk (CEO Only)</h1>
        <div className="space-x-2">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Set Resep
          </Button>
          <Button variant="outline" onClick={() => setShowCalcDialog(true)}>
            <Calculator className="mr-2 h-4 w-4" /> Hitung Produksi
          </Button>
          <Button variant="secondary" onClick={() => setShowProduceDialog(true)}>
            <Play className="mr-2 h-4 w-4" /> Produksi dengan Resep
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <Card key={recipe.product.id}>
            <CardHeader>
              <CardTitle>
                {recipe.product.name} ({recipe.product.code})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold mb-2">
                1 batch/adonan menghasilkan {recipe.product.recipeOutputQty || 1} produk
              </p>
              <div className="mb-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded border bg-gray-50 p-2">
                  <span className="text-gray-600">Estimasi biaya batch: </span>
                  <span className="font-semibold">Rp {Number(recipe.totalRecipeCost || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="rounded border bg-gray-50 p-2">
                  <span className="text-gray-600">Estimasi harga per produk: </span>
                  <span className="font-semibold">Rp {Number(recipe.costPerOutput || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
              <p className="text-sm font-semibold mb-2">Bahan per 1 batch:</p>
              <div className="space-y-2">
                {recipe.ingredients.map((ing) => (
                  <div key={ing.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <div>
                      <span className="font-medium">{ing.ingredient.name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        {ing.qtyNeeded} {ing.ingredient.unit}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        x Rp {Number(ing.unitPrice || 0).toLocaleString('id-ID')} / {ing.ingredient.unit}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        (Stok: {ing.ingredient.currentStock} {ing.ingredient.unit})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteIngredient(ing.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Set Recipe Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Set Resep Produk</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Produk</Label>
              <select
                className="w-full border rounded p-2"
                value={formData.productId}
                onChange={(e) => {
                  const selected = products.find((product) => product.id === e.target.value);
                  setFormData({
                    ...formData,
                    productId: e.target.value,
                    outputQtyPerBatch: String(selected?.recipeOutputQty || 1)
                  });
                }}
                required
              >
                <option value="">Pilih Produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Hasil per 1 batch/adonan</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={formData.outputQtyPerBatch}
                onChange={(e) => setFormData({ ...formData, outputQtyPerBatch: e.target.value })}
                placeholder="Contoh: 24"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Bahan-bahan</Label>
                <Button type="button" size="sm" onClick={handleAddIngredient}>
                  <Plus className="h-4 w-4 mr-1" /> Tambah Bahan
                </Button>
              </div>

              {formData.ingredients.map((ing, index) => {
                const selectedItem = warehouseItems.find((item) => item.id === ing.warehouseItemId);
                return (
                <div key={index} className="grid gap-2 md:grid-cols-[1fr_140px_180px_44px]">
                  <select
                    className="border rounded p-2"
                    value={ing.warehouseItemId}
                    onChange={(e) => handleIngredientChange(index, 'warehouseItemId', e.target.value)}
                    required
                  >
                    <option value="">Pilih Bahan</option>
                    {warehouseItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.unit})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={selectedItem?.unit ? `Qty (${selectedItem.unit})` : 'Qty/gramasi'}
                    value={ing.qtyNeeded}
                    onChange={(e) => handleIngredientChange(index, 'qtyNeeded', e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={selectedItem?.unit ? `Harga / ${selectedItem.unit}` : 'Harga per unit'}
                    value={ing.unitPrice}
                    onChange={(e) => handleIngredientChange(index, 'unitPrice', e.target.value)}
                  />
                  {formData.ingredients.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveIngredient(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan Resep</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Calculate Dialog */}
      <Dialog open={showCalcDialog} onOpenChange={setShowCalcDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hitung Kebutuhan Bahan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <Label>Produk</Label>
              <select
                className="w-full border rounded p-2"
                value={calcData.productId}
                onChange={(e) => setCalcData({ ...calcData, productId: e.target.value })}
                required
              >
                <option value="">Pilih Produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Jumlah Batch</Label>
              <Input
                type="number"
                value={calcData.batchCount}
                onChange={(e) => setCalcData({ ...calcData, batchCount: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full">Hitung</Button>

            {calculation && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="font-semibold mb-2">
                  {calculation.product.name} - {calculation.batchCount} batch menghasilkan {calculation.outputQty} produk
                </p>
                <p className="text-sm mb-2">
                  Estimasi biaya: Rp {Number(calculation.totalCost || 0).toLocaleString('id-ID')} · Rp {Number(calculation.costPerOutput || 0).toLocaleString('id-ID')} / produk
                </p>
                <p className={`text-sm mb-2 ${calculation.canProduce ? 'text-green-600' : 'text-red-600'}`}>
                  {calculation.message}
                </p>
                <div className="space-y-1">
                  {calculation.materialsNeeded.map((m: any, i: number) => (
                    <div key={i} className={`text-sm ${m.sufficient ? '' : 'text-red-600 font-semibold'}`}>
                      {m.ingredient.name}: {m.qtyNeeded} {m.ingredient.unit} 
                      (Stok: {m.currentStock}) · Rp {Number(m.totalPrice || 0).toLocaleString('id-ID')}
                      {!m.sufficient && ` - Kurang ${m.shortage}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Produce Dialog */}
      <Dialog open={showProduceDialog} onOpenChange={setShowProduceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Produksi dengan Resep</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProduce} className="space-y-4">
            <div>
              <Label>Produk</Label>
              <select
                className="w-full border rounded p-2"
                value={produceData.productId}
                onChange={(e) => setProduceData({ ...produceData, productId: e.target.value })}
                required
              >
                <option value="">Pilih Produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Jumlah Batch</Label>
              <Input
                type="number"
                value={produceData.batchCount}
                onChange={(e) => setProduceData({ ...produceData, batchCount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Tanggal Produksi</Label>
              <Input
                type="date"
                value={produceData.date}
                onChange={(e) => setProduceData({ ...produceData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Catatan</Label>
              <Input
                value={produceData.notes}
                onChange={(e) => setProduceData({ ...produceData, notes: e.target.value })}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm">
              <p className="font-semibold">Catatan:</p>
              <p>• Bahan baku akan otomatis berkurang dari gudang</p>
              <p>• Produk jadi akan otomatis bertambah</p>
              <p>• Pastikan stok bahan mencukupi</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowProduceDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Mulai Produksi</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
