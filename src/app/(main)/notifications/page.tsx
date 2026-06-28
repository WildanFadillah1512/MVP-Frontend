"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from '@/lib/api/axios';
import { Bell, CheckCheck, AlertTriangle, Info, Clock, BellOff, Megaphone, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  WARNING: {
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    border: 'border-rose-200 dark:border-rose-800/50',
    label: 'Peringatan',
  },
  KPI: {
    icon: <Clock className="w-5 h-5" />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800/50',
    label: 'KPI / Target',
  },
  INFO: {
    icon: <Info className="w-5 h-5" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-primary/10 dark:bg-primary/10',
    border: 'border-primary/30 dark:border-primary/20',
    label: 'Informasi',
  },
  ANNOUNCEMENT: {
    icon: <Megaphone className="w-5 h-5" />,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-primary/10 dark:bg-primary/10',
    border: 'border-violet-200 dark:border-violet-800/50',
    label: 'Pengumuman',
  },
};

const getConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG['INFO'];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      toast.error('Gagal update notifikasi');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/all/read');
      toast.success('Semua notifikasi sudah dibaca');
      fetchNotifications();
    } catch {
      toast.error('Gagal update notifikasi');
    }
  };

  const displayed = filter === 'UNREAD' ? notifications.filter(n => !n.isRead) : notifications;

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Notifikasi
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-rose-500 text-white min-w-[28px]">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Pusat peringatan, reminder, dan pemberitahuan sistem.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {(['ALL', 'UNREAD'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground dark:text-muted-foreground'
                }`}
              >
                {f === 'ALL' ? 'Semua' : `Belum Dibaca (${unreadCount})`}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white  text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-card/50 border-b border-border p-6">
          <CardTitle className="text-xl font-bold text-foreground">Daftar Notifikasi</CardTitle>
          <CardDescription>Notifikasi otomatis dari stok, laporan, cuti, dan KPI sistem</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <BellOff className="w-10 h-10 text-muted-foreground dark:text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-semibold text-lg">
                {filter === 'UNREAD' ? 'Tidak ada notifikasi yang belum dibaca' : 'Belum ada notifikasi'}
              </p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                {filter === 'UNREAD' ? 'Semua notifikasi sudah dibaca ??' : 'Notifikasi baru akan muncul di sini secara otomatis'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {displayed.map(n => {
                const cfg = getConfig(n.type);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 px-6 py-5 transition-colors ${
                      n.isRead
                        ? 'hover:bg-muted/50/50 hover:bg-muted/50'
                        : 'bg-muted/30 dark:bg-primary/10 hover:bg-muted/50 dark:hover:bg-indigo-900/20'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold text-foreground ${!n.isRead ? 'font-bold' : ''}`}>
                              {n.title}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              {cfg.label}
                            </span>
                            {!n.isRead && (
                              <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: localeId })}
                          </p>
                          {!n.isRead && (
                            <button
                              onClick={() => markRead(n.id)}
                              className="text-xs font-medium text-primary hover:text-primary/80 mt-1 transition-colors"
                            >
                              Tandai dibaca
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
