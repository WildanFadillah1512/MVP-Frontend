import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const values = [
  {
    title: "Disiplin Operasional",
    description: "Datang, melapor, dan menyelesaikan pekerjaan sesuai jadwal yang disepakati."
  },
  {
    title: "Jujur Pada Data",
    description: "Angka produksi, gudang, kasir, dan laporan harian dicatat apa adanya."
  },
  {
    title: "Tanggung Jawab Sampai Tuntas",
    description: "Setiap tugas punya pemilik, deadline, update status, dan penyelesaian yang jelas."
  },
  {
    title: "Koordinasi Antar Divisi",
    description: "Produksi, Gudang, Purchasing, Kasir, dan Manajemen saling memberi informasi yang dibutuhkan."
  },
  {
    title: "Perbaikan Berkelanjutan",
    description: "Masalah dicatat, dievaluasi, lalu diperbaiki agar tidak berulang."
  }
];

export default function CoreValuesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Etos Kerja, Core, dan Prinsip</h1>
        <p className="mt-1 text-muted-foreground">Rujukan sikap kerja harian untuk seluruh karyawan.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {values.map((value) => (
          <Card key={value.title} className="rounded-2xl border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                {value.title}
              </CardTitle>
              <CardDescription>{value.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle>Prinsip Keputusan</CardTitle>
          <CardDescription>Urutan prioritas saat mengambil keputusan kerja.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 text-sm text-foreground md:grid-cols-3">
            <li className="rounded-xl border bg-muted/30 p-4 font-medium">1. Keamanan orang dan kualitas produk.</li>
            <li className="rounded-xl border bg-muted/30 p-4 font-medium">2. Akurasi data dan stok.</li>
            <li className="rounded-xl border bg-muted/30 p-4 font-medium">3. Kecepatan eksekusi tanpa melanggar alur approval.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
