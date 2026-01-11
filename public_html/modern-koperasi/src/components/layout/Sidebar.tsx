'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    BarChart3,
    Settings,
    LogOut,
    PieChart,
    Monitor,
    Wallet,
    X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', roles: ['admin'] },
    { icon: Package, label: 'Kelola Stok', href: '/admin/stok', roles: ['admin'] },
    { icon: Users, label: 'Kelola Anggota', href: '/admin/anggota', roles: ['admin'] },
    { icon: ShoppingCart, label: 'Kelola Kasir', href: '/admin/kasir', roles: ['admin'] },
    { icon: BarChart3, label: 'Laporan', href: '/admin/laporan', roles: ['admin'] },
    { icon: PieChart, label: 'Kelola SHU', href: '/admin/shu', roles: ['admin'] },
    { icon: Monitor, label: 'Monitor Barang', href: '/admin/monitor', roles: ['admin'] },
    { icon: Wallet, label: 'Verifikasi Setoran', href: '/admin/keuangan/setoran', roles: ['admin'] },
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    return (
        <>
            {/* Mobile/Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            K
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                            <div>
                                <h1 className="font-bold text-slate-800 leading-tight">Koperasi PK</h1>
                                <p className="text-xs text-slate-500">Admin Panel</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${pathname === item.href
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-orange-500'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-2 mb-4 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm font-bold">
                            {user?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.nama_user || 'Admin'}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-medium text-sm">Keluar Sekarang</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
