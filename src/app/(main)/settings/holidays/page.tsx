'use client';

import { useState, useEffect } from 'react';
import { holidayApi, Holiday } from '@/features/settings/api/holiday.api';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: '',
    workStartTime: '',
    workEndTime: ''
  });

  const fetchHolidays = async () => {
    try {
      setIsLoading(true);
      const res = await holidayApi.getHolidays();
      setHolidays(res.data);
    } catch (error) {
      toast.error('Gagal memuat data hari libur');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        workStartTime: formData.workStartTime || undefined,
        workEndTime: formData.workEndTime || undefined,
      };

      if (editingId) {
        await holidayApi.updateHoliday(editingId, payload);
        toast.success('Hari libur berhasil diperbarui');
      } else {
        await holidayApi.createHoliday(payload);
        toast.success('Hari libur berhasil ditambahkan');
      }
      setIsModalOpen(false);
      resetForm();
      fetchHolidays();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus hari libur ini?')) return;
    try {
      await holidayApi.deleteHoliday(id);
      toast.success('Hari libur berhasil dihapus');
      fetchHolidays();
    } catch (error) {
      toast.error('Gagal menghapus hari libur');
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingId(holiday.id);
    setFormData({
      date: holiday.date.split('T')[0],
      name: holiday.name,
      description: holiday.description || '',
      workStartTime: holiday.workStartTime || '',
      workEndTime: holiday.workEndTime || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: '',
      name: '',
      description: '',
      workStartTime: '',
      workEndTime: ''
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pengaturan Hari Libur</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola hari libur dan sesuaikan jam kerja spesifik untuk tanggal tertentu.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Hari Libur
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-900">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Nama Libur</th>
                <th className="px-6 py-4 font-semibold">Jam Kerja Khusus</th>
                <th className="px-6 py-4 font-semibold">Keterangan</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data hari libur
                  </td>
                </tr>
              ) : (
                holidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {format(new Date(holiday.date), 'dd MMMM yyyy', { locale: localeID })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{holiday.name}</td>
                    <td className="px-6 py-4">
                      {holiday.workStartTime && holiday.workEndTime ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {holiday.workStartTime} - {holiday.workEndTime}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Default / Libur Penuh</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{holiday.description || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(holiday)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(holiday.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Hari Libur *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Idul Fitri"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label>
                  <input
                    type="time"
                    value={formData.workStartTime}
                    onChange={e => setFormData({ ...formData, workStartTime: e.target.value })}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Keluar</label>
                  <input
                    type="time"
                    value={formData.workEndTime}
                    onChange={e => setFormData({ ...formData, workEndTime: e.target.value })}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Kosongkan jam masuk & keluar jika ini adalah libur penuh (karyawan tidak bekerja).
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Keterangan tambahan..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
