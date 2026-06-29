"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { FileText, Plus, Loader2, Printer, Calendar, User, Briefcase } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function PaklaringPage() {
  const [paklarings, setPaklarings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [form, setForm] = useState({
    employeeId: '',
    position: '',
    department: '',
    startDate: '',
    endDate: '',
    performance: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paklaringRes, usersRes] = await Promise.all([
        api.get('/paklaring'),
        api.get('/users')
      ]);
      if (paklaringRes.data.success) setPaklarings(paklaringRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (error) {
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.position || !form.startDate || !form.endDate || !form.department) {
      toast.error('Mohon lengkapi field wajib (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/paklaring', form);
      if (res.data.success) {
        toast.success('Surat Paklaring berhasil diterbitkan');
        setIsDialogOpen(false);
        setForm({
          employeeId: '', position: '', department: '', startDate: '', endDate: '', performance: '', notes: ''
        });
        fetchData();
      }
    } catch (error) {
      toast.error('Gagal menerbitkan Surat Paklaring');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = (paklaring: any) => {
    // Simple print logic for now (can be expanded to PDF generation)
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Surat Paklaring - ${paklaring.employee.name}</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; padding: 40px; line-height: 1.6; color: #000; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .title { text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
              .subtitle { text-align: center; margin-bottom: 40px; }
              .content { margin-bottom: 40px; }
              .signature { float: right; text-align: center; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin:0;">SIKARYA ERP</h1>
              <p style="margin:5px 0 0 0;">Jl. Contoh Alamat No. 123, Kota, Provinsi</p>
            </div>
            
            <div class="title">SURAT KETERANGAN PENGALAMAN KERJA</div>
            <div class="subtitle">No: ${paklaring.letterNumber}</div>
            
            <div class="content">
              <p>Yang bertanda tangan di bawah ini:</p>
              <table style="margin-left: 20px; margin-bottom: 20px;">
                <tr><td width="150">Nama</td><td>: ${paklaring.issuedBy.name}</td></tr>
                <tr><td>Jabatan</td><td>: ${paklaring.issuedBy.role.name}</td></tr>
                <tr><td>Perusahaan</td><td>: SIKARYA ERP</td></tr>
              </table>

              <p>Menerangkan dengan sesungguhnya bahwa:</p>
              <table style="margin-left: 20px; margin-bottom: 20px;">
                <tr><td width="150">Nama</td><td>: <b>${paklaring.employee.name}</b></td></tr>
                <tr><td>Jabatan Terakhir</td><td>: ${paklaring.position}</td></tr>
                <tr><td>Departemen/Divisi</td><td>: ${paklaring.department}</td></tr>
              </table>

              <p>Telah bekerja pada perusahaan kami terhitung sejak tanggal <b>${format(new Date(paklaring.startDate), 'dd MMMM yyyy', { locale: localeId })}</b> sampai dengan <b>${format(new Date(paklaring.endDate), 'dd MMMM yyyy', { locale: localeId })}</b>.</p>
              
              <p>Selama bekerja, Saudara/i ${paklaring.employee.name} telah menunjukkan dedikasi dan kinerja yang ${paklaring.performance || 'baik'}. Kami mengucapkan terima kasih atas pengabdian yang telah diberikan.</p>
              
              <p>Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya.</p>
            </div>
            
            <div class="signature">
              <p>Dikeluarkan di: _________</p>
              <p>Pada tanggal: ${format(new Date(paklaring.createdAt), 'dd MMMM yyyy', { locale: localeId })}</p>
              <br><br><br><br>
              <p><b><u>${paklaring.issuedBy.name}</u></b></p>
              <p>${paklaring.issuedBy.role.name}</p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" /> Surat Paklaring
          </h1>
          <p className="text-muted-foreground mt-1">Terbitkan dan kelola surat keterangan kerja karyawan.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="rounded-xl shadow-sm">
                <Plus className="w-4 h-4" /> Terbitkan Paklaring
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Terbitkan Surat Paklaring Baru</DialogTitle>
              <DialogDescription>
                Isi form berikut untuk membuat surat keterangan pengalaman kerja resmi.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Pilih Karyawan <span className="text-rose-500">*</span></Label>
                <Select value={form.employeeId} onValueChange={v => setForm({...form, employeeId: v || ''})}>
                <SelectTrigger className="rounded-xl overflow-hidden">
                  <SelectValue placeholder="Cari karyawan...">
                    {form.employeeId ? users.find(u => u.id === form.employeeId)?.name : "Cari karyawan..."}
                  </SelectValue>
                </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.role?.name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jabatan Terakhir <span className="text-rose-500">*</span></Label>
                  <Input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="Misal: Staff Produksi" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Departemen/Divisi <span className="text-rose-500">*</span></Label>
                  <Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Misal: Produksi Pastry" className="rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Masuk <span className="text-rose-500">*</span></Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Keluar <span className="text-rose-500">*</span></Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Penilaian Performa</Label>
                <Input value={form.performance} onChange={e => setForm({...form, performance: e.target.value})} placeholder="Misal: Sangat Baik / Memuaskan" className="rounded-xl" />
                <p className="text-[11px] text-muted-foreground">Opsional. Default: 'baik'</p>
              </div>

              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="..." className="rounded-xl" />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="rounded-xl w-full sm:w-auto">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : 'Terbitkan Surat'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="text-xl font-bold text-foreground">Riwayat Paklaring</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {paklarings.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Belum ada surat paklaring yang diterbitkan</p>
              </div>
            ) : paklarings.map(paklaring => (
              <div key={paklaring.id} className="p-5 hover:bg-muted/50/50 hover:bg-muted/50 transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {paklaring.letterNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Diterbitkan: {format(new Date(paklaring.createdAt), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <p className="font-bold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" /> {paklaring.employee?.name}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4 text-muted-foreground" /> {paklaring.position} ({paklaring.department})
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" /> 
                    {format(new Date(paklaring.startDate), 'dd MMM yyyy')} - {format(new Date(paklaring.endDate), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={() => handlePrint(paklaring)} className="rounded-lg shadow-sm">
                    <Printer className="w-4 h-4" /> Cetak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

