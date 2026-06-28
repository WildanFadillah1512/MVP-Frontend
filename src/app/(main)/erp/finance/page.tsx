"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, DollarSign, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { erpApi } from "@/features/erp/api/erp.api";
import { toast } from "sonner";
import { format } from "date-fns";

export default function FinanceErpPage() {
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<any[]>([]);

  const fetchStatusAndData = async () => {
    try {
      setLoading(true);
      const res = await erpApi.getStatus();
      if (res.success) {
        const financeConfig = res.data.find((c: any) => c.moduleName === 'FINANCE');
        const locked = financeConfig ? financeConfig.isLocked : true;
        setIsLocked(locked);
        
        if (!locked) {
          const ledgerRes = await erpApi.getFinanceLedger();
          if (ledgerRes.success) {
            setLedger(ledgerRes.data);
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Keuangan & Accounting (ERP)</h1>
          <p className="text-muted-foreground mt-2">Buku besar, cash flow, dan laporan laba rugi perusahaan.</p>
        </div>
        {!isLocked && (
           <Button variant="outline" className="border-brand-sage text-primary" disabled>
             <Unlock className="w-4 h-4" /> Modul Aktif
           </Button>
        )}
      </div>

      {isLocked ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-border mt-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none flex gap-4 p-8 blur-[2px]">
            <div className="h-40 bg-gray-200 rounded w-1/3"></div>
            <div className="h-40 bg-gray-200 rounded w-1/3"></div>
            <div className="h-40 bg-gray-200 rounded w-1/3"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center bg-white/80 p-8 rounded-2xl  border border-border shadow-sm">
            <div className="w-16 h-16 bg-brand-dusty-rose/20 rounded-full flex items-center justify-center mb-4 text-brand-dusty-rose">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground text-center">Modul Premium Terkunci</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Sistem <b>Accounting Otomatis</b> ini sudah diprogram di backend, namun membutuhkan lisensi ERP Enterprise untuk diakses.
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
            <CardTitle>Buku Besar (General Ledger)</CardTitle>
            <CardDescription>Catatan seluruh transaksi keuangan perusahaan</CardDescription>
          </CardHeader>
          <CardContent>
            {ledger.length === 0 ? (
              <p className="text-muted-foreground text-center p-4 border border-dashed rounded-lg">Belum ada transaksi tercatat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Deskripsi</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-3">{format(new Date(item.date), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${item.type === 'DEBIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">Rp {item.amount.toLocaleString('id-ID')}</td>
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

