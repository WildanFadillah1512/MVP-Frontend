"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { attendanceApi } from "@/features/attendance/api/attendance.api";
import { Clock, MapPin, Navigation, RefreshCw, ShieldCheck, User as UserIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

type LocationUser = {
  id: string;
  name: string;
  email: string;
  role: { name: string };
  division: { name: string };
};

type LocationLog = {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  activity: "CHECK_IN" | "CHECK_OUT" | string;
  notes?: string | null;
  createdAt: string;
  user: LocationUser;
};

const managerialRoles = ["OWNER", "CEO", "GM", "ADMIN", "MANAGER", "LEADER"];

const getActivityLabel = (activity: string) => {
  if (activity === "CHECK_IN") return "Check-in";
  if (activity === "CHECK_OUT") return "Check-out";
  return activity.replaceAll("_", " ");
};

const getMapsUrl = (location: LocationLog) => {
  return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
};

export default function TrackingPage() {
  const [logs, setLogs] = useState<LocationLog[]>([]);
  const [groupedLocations, setGroupedLocations] = useState<Map<string, { user: LocationUser, checkIn?: LocationLog, checkOut?: LocationLog }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState("");

  const fetchLocations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await attendanceApi.getLocations();
      if (res.success) {
        const payload = res.data;
        const logsArray = Array.isArray(payload) ? payload : (payload.logs || []);
        setLogs(logsArray);
        
        const grouped = new Map<string, { user: LocationUser, checkIn?: LocationLog, checkOut?: LocationLog }>();
        // logsArray usually ordered by newest first, so iterating from end (oldest) or just setting it.
        // Or better, just iterate and pick latest checkIn and checkOut.
        logsArray.forEach((item: LocationLog) => {
          if (!grouped.has(item.userId)) {
            grouped.set(item.userId, { user: item.user });
          }
          const userGroup = grouped.get(item.userId)!;
          if (item.activity === "CHECK_IN" && !userGroup.checkIn) {
            userGroup.checkIn = item;
          }
          if (item.activity === "CHECK_OUT" && !userGroup.checkOut) {
            userGroup.checkOut = item;
          }
        });
        setGroupedLocations(grouped);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengambil data tracking lokasi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUserRole(parsedUser.role.name);
    }
    fetchLocations();
  }, []);

  const isManagerial = managerialRoles.includes(userRole);

  const activitySummary = useMemo(() => {
    return Array.from(groupedLocations.values()).reduce(
      (summary, group) => {
        if (group.checkIn) summary.checkedIn += 1;
        if (group.checkOut) summary.checkedOut += 1;
        return summary;
      },
      { checkedIn: 0, checkedOut: 0 }
    );
  }, [groupedLocations]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!isManagerial) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <MapPin className="h-16 w-16 text-rose-500 opacity-50" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Akses ditolak</h2>
          <p className="mt-2 text-muted-foreground">Tracking lokasi hanya dapat dibuka oleh atasan sesuai struktur tim.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary text-secondary-foreground p-8 rounded-3xl shadow-xl shadow-secondary/10 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            Akses sesuai hierarki
          </div>
          <h1 className="flex items-center gap-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            <MapPin className="h-8 w-8 text-secondary-foreground/80" />
            Tracking Lokasi Karyawan
          </h1>
          <p className="mt-2 text-secondary-foreground/70 font-medium">
            Pantau titik GPS dari check-in dan check-out tim yang berada di bawah wewenang akun ini.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLocations(true)}
          disabled={refreshing}
          className="relative z-10 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Karyawan terpantau</CardDescription>
            <CardTitle className="text-4xl font-black text-foreground">{groupedLocations.size}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-emerald-800 dark:text-emerald-300">Lokasi terakhir check-in</CardDescription>
            <CardTitle className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{activitySummary.checkedIn}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-amber-800 dark:text-amber-300">Lokasi terakhir check-out</CardDescription>
            <CardTitle className="text-4xl font-black text-amber-700 dark:text-amber-400">{activitySummary.checkedOut}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-card border-b border-border/50 px-6 py-5">
          <CardTitle className="text-xl font-bold text-foreground">Lokasi Terbaru Per Karyawan</CardTitle>
          <CardDescription>Posisi terkini berdasarkan aktivitas absensi terakhir.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-muted/10">
          {groupedLocations.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <MapPin className="h-12 w-12 opacity-20 mb-3" />
              <p className="font-semibold text-foreground">Belum ada titik lokasi</p>
              <p className="text-sm">Tidak ada catatan check-in atau check-out dari tim Anda.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from(groupedLocations.entries()).map(([userId, group]) => (
                <div key={userId} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all group flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground text-lg">{group.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground font-medium mt-0.5">
                        {group.user.division.name} - {group.user.role.name}
                      </p>
                    </div>
                  </div>
                  
                  {group.checkIn && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-800/50 p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-1 rounded">Check-in</span>
                        <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                          <Clock className="h-3 w-3" />
                          {format(new Date(group.checkIn.createdAt), "HH:mm")}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-emerald-800/70 dark:text-emerald-300/70 truncate mb-2">
                        📍 {group.checkIn.latitude}, {group.checkIn.longitude}
                      </div>
                      <a
                        href={getMapsUrl(group.checkIn)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white transition-all hover:bg-emerald-700"
                      >
                        <Navigation className="h-3 w-3" /> Maps
                      </a>
                    </div>
                  )}

                  {group.checkOut ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/50 p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-1 rounded">Check-out</span>
                        <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          {format(new Date(group.checkOut.createdAt), "HH:mm")}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-amber-800/70 dark:text-amber-300/70 truncate mb-2">
                        📍 {group.checkOut.latitude}, {group.checkOut.longitude}
                      </div>
                      <a
                        href={getMapsUrl(group.checkOut)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 text-xs font-bold text-white transition-all hover:bg-amber-700"
                      >
                        <Navigation className="h-3 w-3" /> Maps
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-3 text-center flex items-center justify-center h-[100px]">
                      <span className="text-xs text-muted-foreground/70 font-medium italic">Belum Check-out</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-card border-b border-border/50 px-6 py-5">
          <CardTitle className="text-xl font-bold text-foreground">Riwayat Semua Lokasi Absensi</CardTitle>
          <CardDescription>{logs.length} catatan GPS terbaru dari seluruh anggota tim.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/20">
                <tr>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Waktu</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Karyawan</th>
                  <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Aktivitas</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Titik GPS & Catatan</th>
                  <th className="px-6 py-4 text-right font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground font-medium">
                      Belum ada data tracking lokasi
                    </td>
                  </tr>
                ) : (
                  logs.map((location) => (
                    <tr key={location.id} className="transition-colors hover:bg-muted/50">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{format(new Date(location.createdAt), "HH:mm")}</span>
                          <span className="text-xs">{format(new Date(location.createdAt), "dd MMM yyyy", { locale: localeId })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                            {location.user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{location.user.name}</p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">
                              {location.user.division.name} - {location.user.role.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                            location.activity === "CHECK_IN"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800"
                          }`}
                        >
                          {getActivityLabel(location.activity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        <span className="block font-medium mb-1">{location.notes || "-"}</span>
                        <div className="font-mono text-xs text-muted-foreground/60">
                          {location.latitude}, {location.longitude}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={getMapsUrl(location)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm"
                        >
                          <Navigation className="h-3 w-3" />
                          Peta
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
