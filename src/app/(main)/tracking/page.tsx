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
  const [latestLocations, setLatestLocations] = useState<LocationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState("");

  const fetchLocations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await attendanceApi.getLocations();
      if (res.success) {
        const payload = res.data;
        if (Array.isArray(payload)) {
          setLogs(payload);
          const latest = new Map<string, LocationLog>();
          payload.forEach((item) => {
            if (!latest.has(item.userId)) latest.set(item.userId, item);
          });
          setLatestLocations(Array.from(latest.values()));
        } else {
          setLogs(payload.logs || []);
          setLatestLocations(payload.latest || []);
        }
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
    return latestLocations.reduce(
      (summary, location) => {
        if (location.activity === "CHECK_IN") summary.checkedIn += 1;
        if (location.activity === "CHECK_OUT") summary.checkedOut += 1;
        return summary;
      },
      { checkedIn: 0, checkedOut: 0 }
    );
  }, [latestLocations]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-primary" />
      </div>
    );
  }

  if (!isManagerial) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <MapPin className="h-16 w-16 text-rose-500 opacity-50" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Akses ditolak</h2>
          <p className="mt-2 text-slate-500">Tracking lokasi hanya dapat dibuka oleh atasan sesuai struktur tim.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-[#D7CBB5]/70 bg-white/85 p-5 shadow-sm dark:border-[#754437] dark:bg-[#4A2B21]/80 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D7CBB5] bg-[#FAF3E0] px-3 py-1 text-xs font-semibold text-[#754437] dark:border-[#754437] dark:bg-[#3E231B] dark:text-[#D7CBB5]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Akses sesuai hierarki
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            <MapPin className="h-8 w-8 text-brand-primary" />
            Tracking Lokasi Karyawan
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pantau titik GPS dari check-in dan check-out tim yang berada di bawah wewenang akun ini.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLocations(true)}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg border-[#D7CBB5]/70">
          <CardHeader className="pb-2">
            <CardDescription>Karyawan terpantau</CardDescription>
            <CardTitle className="text-3xl">{latestLocations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg border-[#D7CBB5]/70">
          <CardHeader className="pb-2">
            <CardDescription>Lokasi terakhir check-in</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{activitySummary.checkedIn}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg border-[#D7CBB5]/70">
          <CardHeader className="pb-2">
            <CardDescription>Lokasi terakhir check-out</CardDescription>
            <CardTitle className="text-3xl text-amber-700">{activitySummary.checkedOut}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-lg border-[#D7CBB5]/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Lokasi terakhir per karyawan</CardTitle>
          <CardDescription>Posisi terbaru berdasarkan aktivitas absensi terakhir.</CardDescription>
        </CardHeader>
        <CardContent>
          {latestLocations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
              Belum ada titik lokasi dari check-in atau check-out tim.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {latestLocations.map((location) => (
                <div key={location.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{location.user.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {location.user.division.name} - {location.user.role.name}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        location.activity === "CHECK_IN"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {getActivityLabel(location.activity)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(location.createdAt), { addSuffix: true, locale: localeId })}
                  </div>
                  <div className="mt-2 font-mono text-[11px] text-slate-400">
                    {location.latitude}, {location.longitude}
                  </div>
                  <a
                    href={getMapsUrl(location)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-brand-primary/30 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Buka Google Maps
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-[#D7CBB5]/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Riwayat lokasi absensi</CardTitle>
          <CardDescription>{logs.length} catatan GPS terbaru.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Waktu</th>
                  <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Karyawan</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">Aktivitas</th>
                  <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Catatan</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Belum ada data tracking lokasi
                    </td>
                  </tr>
                ) : (
                  logs.map((location) => (
                    <tr key={location.id} className="transition-colors hover:bg-[#FAF3E0]/45 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(location.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#28374A] text-white">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{location.user.name}</p>
                            <p className="text-xs text-slate-400">
                              {location.user.division.name} - {location.user.role.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                            location.activity === "CHECK_IN"
                              ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "border-amber-200 bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                          }`}
                        >
                          {getActivityLabel(location.activity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        {location.notes || "-"}
                        <div className="mt-1 font-mono text-[10px] text-slate-400">
                          {location.latitude}, {location.longitude}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={getMapsUrl(location)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90"
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
