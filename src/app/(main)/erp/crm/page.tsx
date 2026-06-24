"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Users, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { erpApi } from "@/features/erp/api/erp.api";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CRMErpPage() {
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchStatusAndData = async () => {
    try {
      setLoading(true);
      const res = await erpApi.getStatus();
      if (res.success) {
        const crmConfig = res.data.find((c: any) => c.moduleName === 'CRM');
        const locked = crmConfig ? crmConfig.isLocked : true;
        setIsLocked(locked);
        
        if (!locked) {
          const crmRes = await erpApi.getCustomers();
          if (crmRes.success) {
            setCustomers(crmRes.data);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndData();
  }, []);

  if (loading) return <div>Memuat data modul...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-charcoal">CRM & Membership (ERP)</h1>
          <p className="text-muted-foreground mt-2">Manajemen pelanggan, poin, dan riwayat transaksi.</p>
        </div>
        {!isLocked && (
           <Button variant="outline" className="border-brand-sage text-brand-sage" disabled>
             <Unlock className="w-4 h-4 mr-2" /> Modul Aktif
           </Button>
        )}
      </div>

      {isLocked ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-border mt-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col gap-4 p-8 blur-[2px]">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-5/6"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center bg-white/80 p-8 rounded-2xl backdrop-blur-sm border border-border shadow-sm">
            <div className="w-16 h-16 bg-brand-dusty-rose/20 rounded-full flex items-center justify-center mb-4 text-brand-dusty-rose">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-brand-charcoal text-center">Modul Premium Terkunci</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Fitur <b>Customer Relationship Management (CRM)</b> ini sudah diprogram di dalam sistem, namun membutuhkan lisensi ERP Enterprise untuk diakses.
            </p>
            <div className="flex gap-4">
              <Button className="bg-gray-300 hover:bg-gray-400 text-gray-700 cursor-not-allowed" disabled>
                Upgrade ke Enterprise
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Data Pelanggan</CardTitle>
            <CardDescription>Manajemen data member dan poin</CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <p className="text-muted-foreground text-center p-4 border border-dashed rounded-lg">Belum ada pelanggan terdaftar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-brand-oat-milk/50 border-b">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Telepon</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3 text-right">Poin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">{item.phone || '-'}</td>
                        <td className="px-4 py-3">{item.email || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-brand-sage">{item.totalPoints} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

