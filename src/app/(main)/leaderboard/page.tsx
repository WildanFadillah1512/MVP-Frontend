"use client";

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { Trophy, Medal, Star, CalendarDays, FileText, Target, Award, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kpi' | 'attendance' | 'report' | 'target'>('kpi');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchLeaderboard();
  }, [month]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getMonthlyLeaderboard(month);
      if (res.success) {
        setLeaderboard(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'kpi', label: 'KPI Keseluruhan', icon: <Award className="w-4 h-4" />, desc: 'Skor performa gabungan' },
    { id: 'attendance', label: 'Absensi Terajin', icon: <CalendarDays className="w-4 h-4" />, desc: 'Tingkat kehadiran tertinggi' },
    { id: 'report', label: 'Laporan Terbaik', icon: <FileText className="w-4 h-4" />, desc: 'Pengumpulan laporan harian' },
    { id: 'target', label: 'Pencapaian Target', icon: <Target className="w-4 h-4" />, desc: 'Penyelesaian target angka' },
  ] as const;

  const sortedLeaderboard = [...leaderboard]
    .sort((a, b) => b.scores[activeTab] - a.scores[activeTab])
    .slice(0, 10);

  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return "from-yellow-400 to-yellow-600 shadow-yellow-500/30 text-yellow-50 border-yellow-300";
      case 2: return "from-slate-300 to-slate-500 shadow-slate-500/30 text-slate-50 border-slate-300";
      case 3: return "from-amber-600 to-amber-800 shadow-amber-700/30 text-amber-50 border-amber-600";
      default: return "bg-muted text-muted-foreground border-transparent";
    }
  };

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Trophy className="w-12 h-12 text-yellow-100" />;
      case 2: return <Medal className="w-10 h-10 text-slate-100" />;
      case 3: return <Medal className="w-10 h-10 text-amber-100" />;
      default: return null;
    }
  };

  const renderMetricDetail = (user: any, tab: string) => {
    if (tab === 'kpi') return <span className="font-bold text-lg">{user.scores.kpi}%</span>;
    if (tab === 'attendance') return <span><strong className="text-lg">{user.scores.attendance}%</strong> ({user.raw.attendanceDays}/{user.raw.workingDays} Hari)</span>;
    if (tab === 'report') return <span><strong className="text-lg">{user.scores.report}%</strong> ({user.raw.reportDays}/{user.raw.workingDays} Hari)</span>;
    if (tab === 'target') return <span><strong className="text-lg">{user.scores.target}%</strong> ({user.raw.targetCount} Target)</span>;
    return null;
  };

  const top3 = sortedLeaderboard.slice(0, 3);
  // Reorder for podium visual: 2, 1, 3
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Header Area */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 p-10 md:p-14 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Trophy className="w-64 h-64 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-widest uppercase mb-6">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Top 10 Performers
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
              Leaderboard <br className="hidden md:block"/>Karyawan Terbaik
            </h1>
            <p className="text-indigo-100/80 text-lg max-w-lg">
              Apresiasi untuk dedikasi dan kerja keras. Peringkat dihitung berdasarkan metrik performa aktual secara real-time.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-black/30 p-2 rounded-2xl backdrop-blur-xl border border-white/10">
            <div className="px-4 text-sm font-medium text-white/70">Periode</div>
            <Select value={month} onValueChange={(val) => { if (val) setMonth(val); }}>
              <SelectTrigger className="w-[160px] rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus:ring-0 focus:ring-offset-0 transition-colors h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}>Bulan Ini</SelectItem>
                <SelectItem value={`${new Date().getFullYear()}-${String(new Date().getMonth()).padStart(2, '0')}`}>Bulan Lalu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-start p-5 rounded-2xl transition-all duration-300 text-left border ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-primary scale-[1.02]' 
                : 'bg-card text-card-foreground border-border hover:border-primary/40 hover:bg-muted/50'
            }`}
          >
            <div className={`p-2.5 rounded-xl mb-3 ${activeTab === tab.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
              {tab.icon}
            </div>
            <span className="font-bold text-sm md:text-base">{tab.label}</span>
            <span className={`text-xs mt-1 ${activeTab === tab.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : sortedLeaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-3xl border border-border">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Belum ada data</h3>
          <p className="text-muted-foreground">Data leaderboard bulan ini belum tersedia.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Podium (Top 3) */}
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 pt-10 px-4">
            {podiumOrder.map((user, index) => {
              if (!user) return <div key={index} className="w-full md:w-1/3 max-w-[280px]" />;
              // Since podiumOrder is [Rank 2, Rank 1, Rank 3]
              const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
              const heightClass = actualRank === 1 ? 'h-[320px]' : actualRank === 2 ? 'h-[260px]' : 'h-[220px]';
              const rankStyle = getRankStyle(actualRank);

              return (
                <div key={user.id} className="w-full md:w-1/3 max-w-[280px] flex flex-col items-center group relative">
                  {/* Floating Metric Badge */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2 whitespace-nowrap z-20">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    {renderMetricDetail(user, activeTab)}
                  </div>

                  <div className="relative z-10 flex flex-col items-center mb-6 transition-transform duration-500 group-hover:-translate-y-4">
                    <div className={`relative p-1 rounded-full bg-gradient-to-br ${rankStyle} shadow-xl mb-4`}>
                      <div className="w-24 h-24 rounded-full bg-card overflow-hidden border-4 border-card flex items-center justify-center">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-black text-muted-foreground/30">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={`absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black bg-gradient-to-br ${rankStyle} shadow-lg border-2 border-card`}>
                        {actualRank}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-foreground text-center line-clamp-1">{user.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground text-center">{user.division}</p>
                    
                    {actualRank === 1 && (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold shadow-sm">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" /> TOP PERFORMER
                      </div>
                    )}
                  </div>

                  {/* Podium Base */}
                  <div className={`w-full rounded-t-3xl bg-gradient-to-t ${rankStyle} opacity-90 relative overflow-hidden transition-all duration-500 group-hover:opacity-100 group-hover:brightness-110 flex flex-col items-center justify-end pb-8 ${heightClass}`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-0 inset-x-0 h-px bg-white/40"></div>
                    {getRankIcon(actualRank)}
                    <div className="mt-4 text-center z-10 text-white/90 font-medium">
                      {renderMetricDetail(user, activeTab)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* List (Rank 4-10) */}
          {sortedLeaderboard.length > 3 && (
            <div className="max-w-4xl mx-auto w-full">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                Peringkat 4 - 10
              </h3>
              <div className="flex flex-col gap-3">
                {sortedLeaderboard.slice(3).map((user, i) => {
                  const rank = i + 4;
                  return (
                    <Card key={user.id} className="border-border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 group overflow-hidden rounded-2xl">
                      <CardContent className="p-0">
                        <div className="flex items-center p-4 sm:p-5">
                          <div className="w-12 text-center shrink-0">
                            <span className="text-2xl font-black text-muted-foreground/30 group-hover:text-primary transition-colors">
                              {rank}
                            </span>
                          </div>
                          
                          <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 mr-4 border border-border">
                            {user.photoUrl ? (
                              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold text-muted-foreground/40">{user.name.charAt(0)}</span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground truncate">{user.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">{user.role} · {user.division}</p>
                          </div>
                          
                          <div className="text-right flex flex-col items-end">
                            <div className="bg-primary/5 text-primary px-3 py-1.5 rounded-xl border border-primary/10">
                              {renderMetricDetail(user, activeTab)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
