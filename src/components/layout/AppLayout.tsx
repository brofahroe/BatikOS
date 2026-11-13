'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Boxes,
  Hammer,
  ShoppingCart,
  Users2,
  Wallet,
  Palette,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  UserCircle,
} from 'lucide-react';
import { Role } from '@prisma/client';

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    username: string;
    fullName: string;
    role: Role;
  };
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dasbor Utama', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'OWNER', 'CASHIER', 'PRODUCTION', 'INVENTORY'] },
    { name: 'Inventaris & Bahan', href: '/inventaris', icon: Boxes, roles: ['ADMIN', 'OWNER', 'INVENTORY', 'PRODUCTION'] },
    { name: 'Produksi & WO', href: '/produksi', icon: Hammer, roles: ['ADMIN', 'OWNER', 'PRODUCTION'] },
    { name: 'Penjualan (POS)', href: '/penjualan', icon: ShoppingCart, roles: ['ADMIN', 'OWNER', 'CASHIER'] },
    { name: 'Pelanggan (CRM)', href: '/pelanggan', icon: Users2, roles: ['ADMIN', 'OWNER', 'CASHIER'] },
    { name: 'Keuangan & Kas', href: '/keuangan', icon: Wallet, roles: ['ADMIN', 'OWNER'] },
    { name: 'Visualizer & Desain', href: '/visualizer', icon: Palette, roles: ['ADMIN', 'OWNER', 'CASHIER', 'PRODUCTION'] },
    { name: 'Manajemen Pengguna', href: '/pengguna', icon: ShieldCheck, roles: ['ADMIN', 'OWNER'] },
    { name: 'Pengaturan Toko', href: '/pengaturan', icon: Settings, roles: ['ADMIN', 'OWNER'] },
  ];

  const allowedNav = navigation.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1F1412] text-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-[#170E0D]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#8B2E25] flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
              BS
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-wide leading-tight">Batik Seng</h1>
              <p className="text-[10px] text-amber-500 font-medium tracking-wider uppercase">ERP Modern</p>
            </div>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {allowedNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#8B2E25] text-white shadow-md shadow-[#8B2E25]/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 bg-[#170E0D]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-4 lg:px-8 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-800">
              {allowedNav.find((n) => n.href === pathname)?.name || 'Dasbor'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Vercel + Neon Production Ready</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <UserCircle className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-medium hidden md:inline text-slate-700">
                {user.fullName} ({user.role})
              </span>
            </div>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

