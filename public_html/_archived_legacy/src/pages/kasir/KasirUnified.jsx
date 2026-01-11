// src/pages/kasir/KasirUnified.jsx - Unified Kasir Dashboard with Shopee-Style UI
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

// Tab Components
import DashboardTab from './tabs/DashboardTab';
import InputPenjualanTab from './tabs/InputPenjualanTab';
import PembayaranHutangTab from './tabs/PembayaranHutangTab';
import OpnameStokTab from './tabs/OpnameStokTab';
import KeuanganTab from './tabs/KeuanganTab';
import RiwayatTab from './tabs/RiwayatTab';

const KasirUnified = ({ user }) => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tab || 'dashboard');
    const [stats, setStats] = useState({
        totalPenjualan: 0,
        totalTransaksi: 0,
        totalHutang: 0,
        stokMenipis: 0
    });

    // Tab configuration with Shopee-style icons and colors
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠', color: 'from-orange-500 to-orange-600' },
        { id: 'penjualan', label: 'Penjualan', icon: '🛒', color: 'from-blue-500 to-blue-600' },
        { id: 'hutang', label: 'Hutang', icon: '💳', color: 'from-purple-500 to-purple-600' },
        { id: 'stok', label: 'Stok', icon: '📦', color: 'from-emerald-500 to-emerald-600' },
        { id: 'keuangan', label: 'Keuangan', icon: '💰', color: 'from-amber-500 to-amber-600' },
        { id: 'riwayat', label: 'Riwayat', icon: '📜', color: 'from-rose-500 to-rose-600' }
    ];

    // Sync activeTab with URL parameter
    useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (!tab && activeTab !== 'dashboard') {
            setActiveTab('dashboard');
        }
    }, [tab]);

    // Fetch statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api('getDashboardKasir', 'GET');
                if (res && res.success) {
                    const data = res.data?.data || res.data || {};
                    setStats({
                        totalPenjualan: data.totalPenjualanHariIni || 0,
                        totalTransaksi: data.totalTransaksiHariIni || 0,
                        totalHutang: data.hutangBelumLunas || 0,
                        stokMenipis: data.stokMenipis || 0
                    });
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };
        fetchStats();

        // Auto-refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle tab change with smooth transition
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const path = tabId === 'dashboard' ? '/kasir' : `/kasir/${tabId}`;
        navigate(path, { replace: true });
    };

    // Render active tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab user={user} />;
            case 'penjualan':
                return <InputPenjualanTab user={user} />;
            case 'hutang':
                return <PembayaranHutangTab user={user} />;
            case 'stok':
                return <OpnameStokTab user={user} />;
            case 'keuangan':
                return <KeuanganTab user={user} />;
            case 'riwayat':
                return <RiwayatTab user={user} />;
            default:
                return <DashboardTab user={user} />;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
            {/* Header with Shopee-style gradient */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                <span className="text-4xl">🏪</span>
                                Dashboard Kasir
                            </h1>
                            <p className="text-orange-100 mt-2">Kelola transaksi dan operasional kasir dengan mudah</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
                                👤 {user?.username || 'Kasir'}
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs">
                                🕐 {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards - Shopee Style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Penjualan */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Penjualan Hari Ini</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPenjualan)}</p>
                                    <p className="text-xs text-emerald-600 mt-1 font-medium">↗ Target tercapai</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Transaksi */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Transaksi Hari Ini</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalTransaksi} <span className="text-sm text-gray-500">transaksi</span></p>
                                    <p className="text-xs text-blue-600 mt-1 font-medium">⚡ Aktif</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Hutang */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Hutang Belum Lunas</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalHutang)}</p>
                                    <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Perlu perhatian</p>
                                </div>
                            </div>
                        </div>

                        {/* Stok Menipis */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Stok Menipis</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.stokMenipis} <span className="text-sm text-gray-500">item</span></p>
                                    <p className="text-xs text-rose-600 mt-1 font-medium">🚨 Segera restock!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Tab Navigation - Shopee Style */}
                <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
                    <div className="flex overflow-x-auto hide-scrollbar">
                        {tabs.map((tabItem) => (
                            <button
                                key={tabItem.id}
                                onClick={() => handleTabChange(tabItem.id)}
                                className={`
                  flex-1 min-w-fit px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all duration-300 relative
                  ${activeTab === tabItem.id
                                        ? 'text-orange-600 bg-orange-50'
                                        : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50/50'
                                    }
                `}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-2xl">{tabItem.icon}</span>
                                    <span>{tabItem.label}</span>
                                </div>
                                {activeTab === tabItem.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content with smooth transition */}
                <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[600px] transition-all duration-300">
                    {renderTabContent()}
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
};

export default KasirUnified;
