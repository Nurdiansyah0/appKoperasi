'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, History, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navItems = [
        { icon: Home, label: 'Beranda', href: '/anggota/belanja' },
        { icon: History, label: 'Riwayat', href: '/anggota/transaksi' },
        { icon: User, label: 'Profil', href: '/anggota/profil' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 md:top-0 md:bottom-auto md:px-12 md:py-4">
            <div className="hidden md:flex items-center gap-2 mr-8">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">K</div>
                <span className="font-bold text-slate-800">Koperasi PK</span>
            </div>

            <div className="flex flex-1 justify-around md:justify-start md:gap-8 lg:gap-12">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 md:px-4 md:py-2 md:rounded-full transition-all ${pathname === item.href
                            ? 'text-orange-500 md:bg-orange-500 md:text-white md:shadow-lg md:shadow-orange-500/30'
                            : 'text-slate-500 hover:text-orange-500 md:hover:bg-orange-50'
                            }`}
                    >
                        <item.icon size={22} />
                        <span className="text-[10px] font-medium md:text-sm">{item.label}</span>
                    </Link>
                ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-800">{user?.nama_user || user?.username}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{user?.role}</span>
                </div>
                <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    );
}
