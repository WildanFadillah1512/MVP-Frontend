"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { attendanceApi } from '@/features/attendance/api/attendance.api';
import { MapPin, Search, Navigation, Clock, User as UserIcon } from "lucide-react";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TrackingPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  const fetchLocations = async () => {
    try {
      const res = await attendanceApi.getLocations();
      if (res.success) {
        setLocations(res.data);
      }
    } catch (error) {
      toast.error('Gagal mengambil data tracking lokasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const p = JSON.parse(userStr);
      setUserRole(p.role.name);
    }
    fetchLocations();
  }, []);

  const isManagerial = ['OWNER', 'CEO', 'GM', 'ADMIN', 'MANAGER'].includes(userRole);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  if (!isManagerial) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center gap-4">
        <MapPin className="w-16 h-16 text-rose-500 opacity-50" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Akses Ditolak</h2>
          <p className="text-slate-500 mt-2">Anda tidak memiliki izin untuk melihat halaman Tracking Lokasi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
          <MapPin className="w-8 h-8 text-brand-primary" />
          Tracking Lokasi Karyawan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau titik kordinat (GPS) absensi staf dan sales secara real-time.</p>
      </div>

      <Card className="glass-card border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Riwayat Lokasi Absensi</CardTitle>
          <CardDescription>Catatan terbaru</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Waktu</th>
                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Karyawan</th>
                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center">Aktivitas</th>
                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Catatan</th>
                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {locations.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Belum ada data tracking lokasi</td></tr>
              ) : locations.map(loc => (
                <tr key={loc.id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {format(new Date(loc.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{loc.user.name}</p>
                    <p className="text-xs text-slate-400">{loc.user.division.name} · {loc.user.role.name}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      loc.activity === 'CHECK_IN'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
                    }`}>
                      {loc.activity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                    {loc.notes || '-'}
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {loc.latitude}, {loc.longitude}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors text-xs font-semibold"
                    >
                      <Navigation className="w-3 h-3" /> Lihat Peta
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
