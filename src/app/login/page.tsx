"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4" suppressHydrationWarning>
      <Card className="w-full max-w-md border-[#D7CBB5] shadow-xl shadow-[#3E231B]/10">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="SikaryaERP" className="h-12 w-12 rounded-lg object-cover shadow-sm" />
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-[#3E231B]">SikaryaERP</CardTitle>
              <CardDescription>Sistem operasional terpadu</CardDescription>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D7CBB5] bg-[#FAF3E0] px-3 py-1 text-xs font-semibold text-[#754437]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Akses internal perusahaan
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@company.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
