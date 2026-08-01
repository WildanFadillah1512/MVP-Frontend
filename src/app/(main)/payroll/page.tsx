'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api/axios';
import { Plus, CheckCircle, DollarSign, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Payroll {
  id: string;
  userId: string;
  period: string;
  basicSalary: number;
  allowances: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  totalSalary: number;
  workDays: number;
  attendanceDays: number;
  leaveDays: number;
  overtimeHours: number;
  status: string;
  user: {
    name: string;
    email: string;
    role: { name: string };
    division: { name: string };
  };
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [userRole, setUserRole] = useState('');

  const [formData, setFormData] = useState({
    userId: '',
    period: '',
    basicSalary: '',
    allowances: '',
    bonus: '',
    deductions: ''
  });

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const current = JSON.parse(userStr);
      setUserRole(current.role?.name || '');
    }
    fetchPayrolls();
  }, []);

  useEffect(() => {
    if (['OWNER', 'CEO', 'ADMIN', 'MANAGER'].includes(userRole)) {
      fetchUsers();
    }
  }, [userRole]);

  const fetchPayrolls = async () => {
    try {
      const response = await api.get('/payroll');
      setPayrolls(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengambil data payroll');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payroll/generate', {
        ...formData,
        basicSalary: Number(formData.basicSalary),
        allowances: Number(formData.allowances),
        bonus: Number(formData.bonus),
        deductions: Number(formData.deductions)
      });
      toast.success('Payroll berhasil digenerate');
      setShowDialog(false);
      resetForm();
      fetchPayrolls();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal generate payroll');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/payroll/${id}/approve`);
      toast.success('Payroll berhasil disetujui');
      fetchPayrolls();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyetujui payroll');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.patch(`/payroll/${id}/paid`);
      toast.success('Payroll ditandai sudah dibayar');
      fetchPayrolls();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menandai payroll');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      period: '',
      basicSalary: '',
      allowances: '',
      bonus: '',
      deductions: ''
    });
  };

  const showDetail = async (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailDialog(true);
  };

  const canManagePayroll = ['OWNER', 'CEO', 'ADMIN', 'MANAGER'].includes(userRole);
  const canApprovePayroll = ['OWNER', 'CEO'].includes(userRole);
  const canMarkPaid = ['OWNER', 'CEO', 'ADMIN'].includes(userRole);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PAID': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Slip Gaji / Payroll</h1>
        {canManagePayroll && (
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Generate Payroll
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {payrolls.map((payroll) => (
          <Card
            key={payroll.id}
            role="button"
            tabIndex={0}
            onClick={() => showDetail(payroll)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                showDetail(payroll);
              }
            }}
            className="cursor-pointer transition-colors hover:bg-muted/40"
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div>
                  <span className="text-lg">{payroll.user.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {format(new Date(payroll.period), 'MMMM yyyy')}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${getStatusColor(payroll.status)}`}>
                    {payroll.status}
                  </span>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); showDetail(payroll); }}>
                    <Eye className="h-4 w-4 mr-1" /> Detail
                  </Button>
                  {canApprovePayroll && payroll.status === 'PENDING' && (
                    <Button size="sm" onClick={(event) => { event.stopPropagation(); handleApprove(payroll.id); }}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  {canMarkPaid && payroll.status === 'APPROVED' && (
                    <Button size="sm" onClick={(event) => { event.stopPropagation(); handleMarkPaid(payroll.id); }}>
                      <DollarSign className="h-4 w-4 mr-1" /> Tandai Dibayar
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Gaji Pokok</p>
                  <p className="text-lg font-semibold">Rp {payroll.basicSalary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tunjangan</p>
                  <p className="text-lg font-semibold">Rp {payroll.allowances.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Potongan</p>
                  <p className="text-lg font-semibold text-red-600">Rp {payroll.deductions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Gaji</p>
                  <p className="text-xl font-bold text-green-600">Rp {payroll.totalSalary.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                <p>Hari Kerja: {payroll.workDays}</p>
                <p>Hadir: {payroll.attendanceDays}</p>
                <p>Cuti: {payroll.leaveDays}</p>
                <p>Lembur: {payroll.overtimeHours} jam</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate Payroll Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Karyawan</Label>
              <select
                className="w-full border rounded p-2"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                required
              >
                <option value="">Pilih Karyawan</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Periode (Bulan-Tahun)</Label>
              <Input
                type="month"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Gaji Pokok</Label>
              <Input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Tunjangan</Label>
              <Input
                type="number"
                value={formData.allowances}
                onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
              />
            </div>
            <div>
              <Label>Bonus</Label>
              <Input
                type="number"
                value={formData.bonus}
                onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
              />
            </div>
            <div>
              <Label>Potongan</Label>
              <Input
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Generate</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {selectedPayroll && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Slip Gaji</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg">{selectedPayroll.user.name}</h3>
                <p className="text-sm text-gray-600">{selectedPayroll.user.email}</p>
                <p className="text-sm text-gray-600">
                  {selectedPayroll.user.role.name} - {selectedPayroll.user.division.name}
                </p>
                <p className="text-sm text-gray-600">
                  Periode: {format(new Date(selectedPayroll.period), 'MMMM yyyy')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Komponen Gaji</p>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Gaji Pokok:</span>
                      <span className="text-sm font-semibold">Rp {selectedPayroll.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tunjangan:</span>
                      <span className="text-sm font-semibold">Rp {selectedPayroll.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Lembur:</span>
                      <span className="text-sm font-semibold">Rp {selectedPayroll.overtimePay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Bonus:</span>
                      <span className="text-sm font-semibold">Rp {selectedPayroll.bonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">Potongan:</span>
                      <span className="text-sm font-semibold">Rp {selectedPayroll.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-bold">Total Gaji:</span>
                      <span className="text-lg font-bold text-green-600">
                        Rp {selectedPayroll.totalSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold">Kehadiran</p>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Hari Kerja:</span>
                      <span className="text-sm font-semibold">{selectedPayroll.workDays} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hadir:</span>
                      <span className="text-sm font-semibold">{selectedPayroll.attendanceDays} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cuti:</span>
                      <span className="text-sm font-semibold">{selectedPayroll.leaveDays} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Jam Lembur:</span>
                      <span className="text-sm font-semibold">{selectedPayroll.overtimeHours} jam</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
