"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  FileText,
  UploadCloud,
  Target,
  MessageSquare,
  Package,
  ShoppingCart,
  Calculator,
  Box,
  LogOut,
  Menu,
  Lock,
  LineChart,
  DollarSign,
  Bell,
  Search,
  ChevronDown
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getSidebarMenus = (role: string, division: string) => {
  // === MENU YANG BISA DIAKSES SEMUA ROLE ===
  const commonMenus = [
    { name: 'Dashboard', href: `/dashboard/${role.toLowerCase()}`, icon: LayoutDashboard },
    { name: 'Absensi', href: '/attendance', icon: Clock },
    { name: 'Cuti', href: '/leave', icon: Calendar },
    { name: 'Laporan Harian', href: '/daily-reports', icon: FileText },
    { name: 'Upload Harian', href: '/daily-uploads', icon: UploadCloud },
    { name: 'Target & KPI', href: '/performance', icon: Target },
    { name: 'Chat Divisi', href: '/chat', icon: MessageSquare },
  ];

  // === MENU ADMIN-ONLY (CEO & ADMIN saja) ===
  const adminOnlyMenus = [
    { name: 'User Management', href: '/users', icon: Users },
  ];

  // === MENU DIVISI (sesuai divisi masing-masing, atau CEO/ADMIN lihat semua) ===
  const divisionMenuMap: Record<string, any> = {
    PRODUKSI:  { name: 'Produksi',  href: '/production', icon: Package },
    PURCHASING: { name: 'Purchasing', href: '/purchasing', icon: ShoppingCart },
    KASIR:     { name: 'Kasir',     href: '/cashier',   icon: Calculator },
    GUDANG:    { name: 'Gudang',    href: '/warehouse', icon: Box },
  };

  // === MENU ERP TAHAP 2 (hanya CEO & ADMIN, tampil tapi terkunci) ===
  const erpMenus = [
    { name: 'Master Data ERP', href: '/erp/master',   icon: Box,       isLocked: true },
    { name: 'HPP Otomatis',    href: '/erp/hpp',      icon: Calculator, isLocked: true },
    { name: 'Laba Rugi',       href: '/erp/finance',  icon: DollarSign, isLocked: true },
    { name: 'CRM & Membership', href: '/erp/crm',     icon: Users,     isLocked: true },
    { name: 'Business Intel',  href: '/erp/bi',       icon: LineChart,  isLocked: true },
  ];

  // === BUILD MENU BERDASARKAN ROLE ===
  let menus = [...commonMenus];

  if (role === 'CEO' || role === 'ADMIN') {
    // CEO & ADMIN: lihat semua menu divisi + user management + ERP (locked)
    menus = [
      ...menus,
      ...adminOnlyMenus,
      ...Object.values(divisionMenuMap),
      ...erpMenus,
    ];
  } else {
    // MANAGER, LEADER, STAFF: hanya lihat divisi mereka sendiri
    const myDivisionMenu = divisionMenuMap[division.toUpperCase()];
    if (myDivisionMenu) {
      menus = [...menus, myDivisionMenu];
    }
    // Tidak mendapat User Management & ERP sama sekali
  }

  return menus;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);
    setMenus(getSidebarMenus(userData.role.name, userData.division.name));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="p-6 flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-md shadow-brand-primary/20">
            S
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
            Synco<span className="font-light">ERP</span>
          </h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <nav className="space-y-1.5 px-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Menu Utama</div>
          {menus.map((menu) => {
            const isActive = pathname === menu.href || pathname.startsWith(`${menu.href}/`);
            return (
              <Link key={menu.href} href={menu.isLocked ? '#' : menu.href}>
                <span className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  menu.isLocked
                    ? 'text-slate-400 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
                    : isActive
                      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25 translate-x-1'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-brand-primary/20 hover:translate-x-1'
                }`}>
                  <menu.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'}`} />
                  <span className="flex-1">{menu.name}</span>
                  {menu.isLocked && <Lock className="h-3.5 w-3.5 opacity-50" />}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-brand-secondary to-purple-400 text-white font-medium">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</span>
            <span className="text-xs font-medium text-brand-primary truncate">{user.role.name}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full glass z-30 border-b border-slate-200/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold">
            S
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">SyncoERP</h2>
        </div>
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none">
            <Menu className="h-6 w-6 text-slate-700 dark:text-slate-200" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[280px] flex-col fixed inset-y-0 z-20 shadow-xl shadow-slate-200/40 dark:shadow-none border-r border-slate-200/60 dark:border-slate-800">
        <SidebarContent />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-[280px] flex flex-col min-h-screen">
        
        {/* Topbar */}
        <header className="hidden lg:flex h-20 glass sticky top-0 z-10 px-8 items-center justify-between transition-all duration-300">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 w-96 shadow-sm focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Cari menu atau fitur..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></span>
            </Link>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1.5 h-auto flex items-center gap-2 outline-none">
                  <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                    <AvatarFallback className="bg-brand-primary text-white text-xs">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-100 dark:border-slate-800">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2 cursor-pointer">
                  <Users className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="py-2 text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/50 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pt-24 lg:pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}