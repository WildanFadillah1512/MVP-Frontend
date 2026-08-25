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
import { AlertTriangle, Clock, Settings } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export default function WarningsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [defaultDurationDays, setDefaultDurationDays] = useState(90);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    type: "SP 1",
    reason: "",
    durationDays: "",
    notes: ""
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchData = async () => {
    try {
      let params: any = {};
      if (dateRange?.from) params.startDate = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) params.endDate = format(dateRange.to, 'yyyy-MM-dd');

      const [usersRes, warningsRes] = await Promise.all([
        api.get("/users"),
        api.get("/users/warnings", { params })
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data.filter((user: any) => user.isActive));
      if (warningsRes.data.success) {
        setWarnings(warningsRes.data.data.warnings);
        setDefaultDurationDays(warningsRes.data.data.defaultDurationDays);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengambil data SP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const current = JSON.parse(userStr);
      setUserRole(current.role?.name || "");
    }
    fetchData();
  }, [dateRange]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post("/users/warnings", {
        ...form,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined
      });
      if (res.data.success) {
        toast.success(`${form.type} berhasil diterbitkan`);
        setForm({ employeeId: "", type: "SP", reason: "", durationDays: "", notes: "" });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menerbitkan SP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSetting = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.patch("/users/warnings/settings", { durationDays: defaultDurationDays });
      if (res.data.success) toast.success("Durasi default SP diperbarui");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memperbarui setting SP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canUpdateSettings = ["OWNER", "CEO", "ADMIN"].includes(userRole);

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Surat Peringatan (SP)</h1>
        <p className="mt-1 text-muted-foreground">Manager ke atas dapat menerbitkan Surat Peringatan. Status otomatis kadaluarsa sesuai durasi.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Terbitkan SP
            </CardTitle>
                <CardDescription>Isi detail Surat Peringatan. Default berlaku {defaultDurationDays} hari jika durasi dikosongkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Karyawan</Label>
                <Select value={form.employeeId} onValueChange={(value) => setForm({ ...form, employeeId: value || "" })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih karyawan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} - {user.role.name} ({user.division.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori SP</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value || "" })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih SP..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const activeWarnings = warnings.filter(w => w.employeeId === form.employeeId && w.status === "ACTIVE");
                      const activeTypes = activeWarnings.map(w => w.type);
                      const allOptions = ["SP 1", "SP 2", "SP 3"];
                      
                      // If has SP 2 active, can only issue SP 3
                      // If has SP 1 active, can issue SP 2, SP 3
                      // Else can issue SP 1, SP 2, SP 3
                      let availableOptions = allOptions;
                      if (activeTypes.includes("SP 2")) {
                         availableOptions = ["SP 3"];
                      } else if (activeTypes.includes("SP 1")) {
                         availableOptions = ["SP 2", "SP 3"];
                      }
                      
                      // Auto-update selected type if current selection is not available
                      if (form.employeeId && form.type && !availableOptions.includes(form.type) && availableOptions.length > 0) {
                          setTimeout(() => setForm(prev => ({ ...prev, type: availableOptions[0] })), 0);
                      } else if (form.employeeId && !form.type && availableOptions.length > 0) {
                          setTimeout(() => setForm(prev => ({ ...prev, type: availableOptions[0] })), 0);
                      }

                      return availableOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durasi Berlaku (hari)</Label>
                <Input
                  type="number" step="any"
                  min="1"
                  placeholder={`${defaultDurationDays}`}
                  value={form.durationDays}
                  onChange={(event) => setForm({ ...form, durationDays: event.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Alasan Peringatan</Label>
                <Textarea
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  required
                  className="min-h-[100px] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="rounded-xl" />
              </div>
              <Button type="submit" disabled={isSubmitting || !form.employeeId} className="w-full rounded-xl">
                Terbitkan Surat Peringatan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 rounded-2xl border-border shadow-md">
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Riwayat SP
              </CardTitle>
              <CardDescription>SP aktif dan yang sudah kadaluarsa.</CardDescription>
            </div>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </CardHeader>
          <CardContent className="space-y-4">
            {canUpdateSettings && (
              <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Durasi Default SP
                  </Label>
                  <Input
                    type="number" step="any"
                    min="1"
                    value={defaultDurationDays}
                    onChange={(event) => setDefaultDurationDays(Number(event.target.value || 90))}
                    className="rounded-xl"
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleUpdateSetting} disabled={isSubmitting} className="rounded-xl">
                  Simpan Setting
                </Button>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {warnings.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">Belum ada SP</p>
              ) : warnings.map((warning) => (
                <div key={warning.id} className="py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{warning.employee.name}</p>
                        <Badge variant="secondary" className="text-[10px] py-0">{warning.type || "SP"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {warning.employee.role.name} - {warning.employee.division.name} · Oleh {warning.issuedBy.name}
                      </p>
                    </div>
                    <Badge variant="outline" className={warning.status === "ACTIVE" ? "border-amber-300 text-amber-700" : "border-slate-300 text-slate-600"}>
                      {warning.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{warning.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Berlaku sampai {new Date(warning.expiresAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
