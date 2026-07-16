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
  ChevronDown,
  CheckSquare,
  MapPin
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
    { name: 'Laporan Harian', href: '/daily-reports', icon: FileText },
    { name: 'Upload Harian', href: '/daily-uploads', icon: UploadCloud },
    { name: 'Tugas', href: '/tasks', icon: CheckSquare },
    { name: 'Target & KPI', href: '/performance', icon: Target },
    { name: 'Cuti', href: '/leave', icon: Calendar },
    { name: 'Chat Divisi', href: '/chat', icon: MessageSquare },
  ];

  // === MENU ADMIN-ONLY (OWNER, CEO, GM & ADMIN saja) ===
  const adminOnlyMenus = [
    { name: 'User Management', href: '/users', icon: Users },
  ];

  // === MENU MANAJERIAL KE ATAS ===
  const managerialMenus = [
    { name: 'Tracking Lokasi', href: '/tracking', icon: MapPin },
  ];

  // === MENU CEO & OWNER SAJA ===
  const topLevelMenus = [
    { name: 'Surat Paklaring', href: '/paklaring', icon: FileText },
  ];

  // === MENU DIVISI (sesuai divisi masing-masing, atau CEO/ADMIN lihat semua) ===
  const divisionMenuMap: Record<string, any> = {
    PRODUKSI:  { name: 'Produksi',  href: '/production', icon: Package },
    PURCHASING: { name: 'Purchasing', href: '/purchasing', icon: ShoppingCart },
    KASIR:     { name: 'Kasir',     href: '/cashier',   icon: Calculator },
    GUDANG:    { name: 'Gudang',    href: '/warehouse', icon: Box },
  };

  // === MENU CEO/OWNER KHUSUS ===
  const ceoSpecialMenus = [
    { name: 'Resep Produk', href: '/recipes', icon: FileText },
    { name: 'Supplier', href: '/suppliers', icon: Users },
    { name: 'Slip Gaji', href: '/payroll', icon: DollarSign },
    { name: 'Purchase Requests', href: '/purchase-requests', icon: ShoppingCart },
  ];

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

  if (role === 'CEO' || role === 'ADMIN' || role === 'OWNER') {
    menus = [
      ...menus,
      ...managerialMenus,
      ...adminOnlyMenus,
      ...(role === 'CEO' || role === 'OWNER' ? topLevelMenus : []),
      ...(role === 'CEO' || role === 'OWNER' ? ceoSpecialMenus : []),
      ...Object.values(divisionMenuMap),
      ...erpMenus,
    ];
  } else if (role === 'GM') {
    const gmDivisions = { ...divisionMenuMap };
    delete gmDivisions.KASIR;
    menus = [
      ...menus,
      ...managerialMenus,
      ...adminOnlyMenus,
      ...Object.values(gmDivisions),
      ...erpMenus,
    ];
  } else if (role === 'MANAGER' || role === 'LEADER') {
    const myDivisionMenu = divisionMenuMap[division.toUpperCase()];
    menus = [
      ...menus,
      ...managerialMenus,
      ...(role === 'MANAGER' ? adminOnlyMenus : []),
      ...(myDivisionMenu ? [myDivisionMenu] : []),
    ];
  } else {
    // LEADER, STAFF: hanya lihat divisi mereka sendiri
    const myDivisionMenu = divisionMenuMap[division.toUpperCase()];
    if (myDivisionMenu) {
      menus = [...menus, myDivisionMenu];
    }
  }

  return menus;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);
    setMenus(getSidebarMenus(userData.role.name, userData.division.name));
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear(); // Bersihkan SEMUA data sesi, bukan hanya token dan user
    router.push('/login');
  };

  if (!user) return null;

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-6 flex items-center justify-center border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="SikaryaERP" className="w-10 h-10 object-cover rounded shadow-sm" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            Sikarya<span className="font-light">ERP</span>
          </h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <nav className="space-y-1.5 px-4">
          <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3 px-3">Menu Utama</div>
          {menus.map((menu) => {
            const isActive = pathname === menu.href || pathname.startsWith(`${menu.href}/`);
            return (
              <Link key={menu.href} href={menu.isLocked ? '#' : menu.href}>
                <span className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  menu.isLocked
                    ? 'text-muted-foreground cursor-not-allowed opacity-60'
                    : isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md translate-x-1'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1'
                }`}>
                  <menu.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-primary'}`} />
                  <span className="flex-1">{menu.name}</span>
                  {menu.isLocked && <Lock className="h-3.5 w-3.5 opacity-50" />}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-xl bg-sidebar-accent p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shadow-sm">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              user.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-sidebar-foreground truncate">{user.name}</span>
            <span className="text-xs font-medium text-muted-foreground truncate">{user.role.name} - {user.division.name}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full glass z-30 border-b border-border/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="SikaryaERP" className="w-8 h-8 object-cover rounded shadow-sm" />
          <h2 className="text-lg font-bold text-foreground">SikaryaERP</h2>
        </div>
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-full p-2 hover:bg-accent hover:text-accent-foreground transition-colors outline-none">
            <Menu className="h-6 w-6 text-foreground" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl bg-sidebar">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[280px] flex-col fixed inset-y-0 z-20 shadow-xl border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-[280px] flex flex-col min-h-screen">
        
        {/* Topbar */}
        <header className="hidden lg:flex h-20 glass sticky top-0 z-10 px-8 items-center justify-between transition-all duration-300 border-b border-border/50">
          <div className="flex items-center bg-card border border-border rounded-full px-4 py-2 w-96 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari menu atau fitur..." 
              className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse border-2 border-card"></span>
            </Link>
            
            <div className="h-8 w-px bg-border mx-2"></div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full hover:bg-accent px-2 py-1.5 h-auto flex items-center gap-2 outline-none transition-colors">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user.name.substring(0, 2).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')} className="py-2 cursor-pointer">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="py-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4" />
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
