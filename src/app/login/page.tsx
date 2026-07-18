"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { loginSchema, LoginInput, authApi } from "@/features/auth/api/auth.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      if (response.success) {
        sessionStorage.clear();
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("Login berhasil");

        const role = response.data.user.role.name;
        router.push(`/dashboard/${role.toLowerCase()}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background" suppressHydrationWarning>
      {/* Left Pane - Branding & Visuals (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground text-background p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/abstract-pattern.svg')] bg-cover bg-center"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute right-10 top-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 relative rounded-xl overflow-hidden shadow-lg shadow-primary/20">
            <Image src="/logo.jpeg" alt="SikaryaERP Logo" fill className="object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#FAF3E0]">SikaryaERP</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
            <ShieldCheck className="h-4 w-4" />
            Akses Internal
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-[#FAF3E0]">
            Sistem operasional terpadu kelas <span className="text-primary">enterprise</span>.
          </h1>
          <p className="text-lg text-[#FAF3E0]/70 font-medium">
            Kelola absensi, laporan, tugas, dan cuti karyawan Anda dalam satu pintu yang aman, rapi, dan terkontrol.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-medium text-[#FAF3E0]/50">&copy; 2026 PT Sikarya. Hak Cipta Dilindungi.</p>
        </div>
      </div>

      {/* Right Pane - Form (Centered on all screens) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-24 xl:px-32 relative">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo on mobile only */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-16 h-16 relative rounded-2xl overflow-hidden shadow-xl shadow-primary/20 mb-4">
              <Image src="/logo.jpeg" alt="SikaryaERP Logo" fill className="object-cover" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">SikaryaERP</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Selamat Datang</h2>
            <p className="text-muted-foreground font-medium">Masukkan email dan kata sandi Anda untuk mengakses sistem.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-bold">Alamat Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="nama@email.com"
                        autoComplete="email"
                        {...field} 
                        className="h-14 rounded-xl bg-card border-border px-4 text-base shadow-sm focus:ring-primary/50 focus:border-primary transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-bold">Kata Sandi</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Password"
                        autoComplete="current-password"
                        {...field}
                        className="h-14 rounded-xl bg-card border-border px-4 text-base shadow-sm focus:ring-primary/50 focus:border-primary transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Otentikasi..." : "Masuk ke Sistem"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
