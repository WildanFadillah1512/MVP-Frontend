"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/axios";
import { warehouseApi } from "@/features/warehouse/api/warehouse.api";
import { CheckCircle, PackagePlus, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function MaterialRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userDivision, setUserDivision] = useState("");
  const [form, setForm] = useState({
    warehouseItemId: "",
    quantity: "",
    purpose: "",
    notes: ""
  });

  const fetchData = async () => {
    try {
      const [requestRes, itemRes] = await Promise.all([
        api.get("/material-requests"),
        warehouseApi.getItems()
      ]);
      if (requestRes.data.success) setRequests(requestRes.data.data);
      if (itemRes.success) setItems(itemRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengambil request bahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role?.name || "");
      setUserDivision(user.division?.name || "");
    }
    fetchData();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post("/material-requests", {
        ...form,
        quantity: Number(form.quantity)
      });
      if (res.data.success) {
        toast.success("Request bahan dikirim ke Gudang");
        setForm({ warehouseItemId: "", quantity: "", purpose: "", notes: "" });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal membuat request bahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: "fulfill" | "reject") => {
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/material-requests/${id}/${action}`);
      if (res.data.success) {
        toast.success(action === "fulfill" ? "Request dipenuhi dan stok berkurang" : "Request ditolak");
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memproses request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = ["OWNER", "CEO", "ADMIN"].includes(userRole) || (userDivision === "PRODUKSI" && ["LEADER", "MANAGER"].includes(userRole));
  const canProcess = userDivision === "GUDANG" || ["OWNER", "CEO", "ADMIN"].includes(userRole);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Request Bahan</h1>
        <p className="mt-1 text-muted-foreground">Produksi request bahan ke Gudang, lalu Gudang fulfill agar stok otomatis berkurang.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {canCreate && (
          <Card className="lg:col-span-2 rounded-2xl border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-primary" /> Ajukan Request
              </CardTitle>
              <CardDescription>Bahan, jumlah, dan tujuan pemakaian wajib diisi.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Bahan Gudang</Label>
                  <Select value={form.warehouseItemId} onValueChange={(value) => setForm({ ...form, warehouseItemId: value || "" })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pilih bahan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - stok {item.currentStock} {item.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jumlah</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Untuk Apa</Label>
                  <Textarea value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} required className="min-h-[90px] rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="rounded-xl" />
                </div>
                <Button type="submit" disabled={isSubmitting || !form.warehouseItemId} className="w-full rounded-xl">
                  Kirim Request
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className={`${canCreate ? "lg:col-span-3" : "lg:col-span-5"} rounded-2xl border-border shadow-md`}>
          <CardHeader>
            <CardTitle>Daftar Request</CardTitle>
            <CardDescription>Status request bahan produksi ke gudang.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Bahan</th>
                    <th className="px-6 py-3 font-semibold">Peminta</th>
                    <th className="px-6 py-3 font-semibold">Tujuan</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    {canProcess && <th className="px-6 py-3 font-semibold text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {requests.length === 0 ? (
                    <tr><td colSpan={canProcess ? 5 : 4} className="px-6 py-12 text-center text-muted-foreground">Belum ada request bahan</td></tr>
                  ) : requests.map((request) => (
                    <tr key={request.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{request.item.name}</p>
                        <p className="text-xs text-muted-foreground">{request.quantity} {request.item.unit}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{request.requestedBy.name}</p>
                        <p className="text-xs text-muted-foreground">{request.requestedBy.role.name} - {request.requestedBy.division.name}</p>
                      </td>
                      <td className="px-6 py-4 max-w-md">{request.purpose}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{request.status}</Badge>
                      </td>
                      {canProcess && (
                        <td className="px-6 py-4 text-right">
                          {request.status === "PENDING" ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="rounded-lg" onClick={() => handleAction(request.id, "fulfill")} disabled={isSubmitting}>
                                <CheckCircle className="h-4 w-4" /> Fulfill
                              </Button>
                              <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => handleAction(request.id, "reject")} disabled={isSubmitting}>
                                <XCircle className="h-4 w-4" /> Tolak
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sudah diproses</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
