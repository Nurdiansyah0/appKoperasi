'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminMonitor() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalTransactions: 0,
        activeCashiers: [],
        lowStockItems: [],
        recentActivity: []
    });

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return; // Middleware handles redirect usually, but safety check

            const response = await fetch('/api/admin/monitor', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setStats(result.data);
                    setLastUpdated(new Date());
                }
            }
        } catch (error) {
            console.error('Failed to fetch monitor stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchStats();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);

        return () => clearInterval(interval);
    }, []);

    // Format currency
    const formatRp = (val: number) => {
        return 'Rp ' + val.toLocaleString('id-ID');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Live Monitor</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time store activity monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                        Last updated: {lastUpdated?.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={fetchStats}
                        className="p-2 bg-white rounded-full shadow hover:shadow-md transition text-gray-600"
                        title="Refresh Now"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.051M20.418 20.418A9.969 9.969 0 0112 21c-5.523 0-10-4.477-10-10S6.477 1 12 1s4.477.448 8.167 2.05m1.293 2.293l-1.414 1.414" />
                        </svg>
                    </button>
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Revenue Live */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-500 uppercase">Live Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{formatRp(stats.totalRevenue)}</p>
                </div>

                {/* Transactions Count */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-500 uppercase">Transactions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTransactions}</p>
                </div>

                {/* Active Cashiers */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <p className="text-sm font-medium text-gray-500 uppercase">Active Cashiers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeCashiers.length}</p>
                </div>

                {/* Alerts/Low Stock */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                    <p className="text-sm font-medium text-gray-500 uppercase">Low Stock Alerts</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockItems.length}</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Activity & Cashiers */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Recent Transactions */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-xs text-gray-500">Live Feed</span>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((t: any) => (
                                    <div key={t.id} className="p-4 hover:bg-gray-50 transition flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                                ID
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Order #{t.id}</p>
                                                <p className="text-xs text-gray-500">Cashier: {t.cashier}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{formatRp(t.amount)}</p>
                                            <p className="text-xs text-gray-500">{new Date(t.time).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">No transactions yet today.</div>
                            )}
                        </div>
                    </div>

                    {/* Cashier Performance Today */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Today's Cashier Leaderboard</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {stats.activeCashiers.length > 0 ? (
                                    stats.activeCashiers.map((c: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{c.username}</p>
                                                    <p className="text-xs text-gray-500">{c.count} transactions</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatRp(c.revenue)}</p>
                                                <p className="text-xs text-green-600">Active {new Date(c.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No active cashiers found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Low Stock & System Status */}
                <div className="space-y-8">
                    {/* Low Stock Watchlist */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-red-100">
                        <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-red-800">Low Stock Alert</h2>
                            <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full">{stats.lowStockItems.length} Items</span>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {stats.lowStockItems.length > 0 ? (
                                stats.lowStockItems.map((item: any) => (
                                    <div key={item.barang_id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{item.nama_barang}</p>
                                                <p className="text-xs text-gray-500">ID: {item.barang_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.stok === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {item.stok} left
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-green-600 text-sm">
                                    All stock levels are healthy!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
