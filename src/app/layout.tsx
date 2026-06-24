import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "SikaryaERP — Sistem Operasional Terpadu",
  description: "Aplikasi manajemen operasional perusahaan terpadu — Produksi, Gudang, Kasir, Karyawan, dan lebih banyak lagi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${outfit.className} min-h-screen bg-background text-foreground antialiased`} suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
