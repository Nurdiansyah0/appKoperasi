import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ user, onLogout }) {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊', role: 'admin' },
        { path: '/stok', label: 'Kelola Stok', icon: '📦', role: 'admin' },
        { path: '/anggota', label: 'Kelola Anggota', icon: '👥', role: 'admin' },
        { path: '/kasir-management', label: 'Kelola Kasir', icon: '🏪', role: 'admin' },
        { path: '/laporan', label: 'Laporan', icon: '📄', role: 'admin' },
        { path: '/shu-management', label: 'Kelola SHU', icon: '💰', role: 'admin' },
        { path: '/monitor-barang', label: 'Monitor Barang', icon: '👁️', role: 'admin' },
        // Kasir specific items if needed in shared sidebar
        { path: '/kasir', label: 'POS Kasir', icon: '🛒', role: 'kasir' },
        { path: '/kasir/history', label: 'Riwayat Transaksi', icon: 'clock', role: 'kasir' },
    ];

    // Filter items based on role
    const filteredItems = menuItems.filter(item => !item.role || item.role === user?.role);

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-sm">
            {/* Brand */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                    K
                </div>
                <div>
                    <h1 className="font-bold text-gray-800 text-lg tracking-tight">Koperasi PK</h1>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
            </div>

            {/* User Profile Summary */}
            <div className="px-6 py-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {user?.username?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-4 space-y-1 py-2 overflow-y-auto">
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Menu Utama</p>

                {filteredItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                ? 'bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                        {isActive(item.path) && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                    <span>🚪</span>
                    Logout
                </button>
            </div>
        </div>
    );
}
