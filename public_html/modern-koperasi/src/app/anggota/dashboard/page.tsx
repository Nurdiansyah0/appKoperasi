'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import {
    ShoppingBag,
    History,
    Wallet,
    CreditCard,
    TrendingUp,
    User,
    ChevronRight,
    QrCode
} from 'lucide-react';

export default function MemberDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState({
        saldo: 0,
        hutang: 0,
        shu: 0
    });
    const [recentTx, setRecentTx] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const initDashboard = async () => {
            const userData = localStorage.getItem('user');
            if (!userData) {
                router.push('/login');
                return;
            }

            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'anggota') {
                if (parsedUser.role === 'admin') router.push('/admin/dashboard');
                else if (parsedUser.role === 'kasir') router.push('/kasir/dashboard');
                return;
            }

            setUser(parsedUser);

            const fetchData = async () => {
                try {
                    // Fetch Profile (User + Stats)
                    // Note: api.get returns the data directly if the interceptor is set up to return response.data
                    // OR it returns AxiosResponse.
                    // Looking at api.ts: 
                    // response.use((response) => response.data, ...)
                    // So api.get returns the JSON body directly.

                    const profileRes: any = await api.get('/anggota/profil');
                    if (profileRes.success) {
                        setUser(profileRes.data); // Update user state with fresh data if needed
                        setStats({
                            saldo: profileRes.data.saldo,
                            hutang: profileRes.data.hutang,
                            shu: profileRes.data.shu
                        });
                    }

                    // Fetch History
                    const historyRes: any = await api.get('/anggota/history?limit=5');
                    if (historyRes.success) {
                        setRecentTx(historyRes.data);
                    } else if (Array.isArray(historyRes)) { // Fallback for direct array response
                        setRecentTx(historyRes);
                    }

                    // Fetch Announcements
                    const infoRes: any = await api.get('/pengumuman');
                    if (infoRes.success) {
                        setAnnouncements(infoRes.data);
                    }

                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        };

        initDashboard();
    }, [router]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 transform skew-x-12 translate-x-12"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Selamat Datang,</p>
                                <h2 className="text-2xl font-bold">{user?.nama_lengkap || user?.username}</h2>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-orange-700/50 rounded text-xs font-semibold tracking-wider uppercase">
                                    Anggota Koperasi
                                </span>
                            </div>
                        </div>
                        <div className="text-center md:text-right bg-white/10 px-6 py-2 rounded-xl backdrop-blur-sm">
                            <p className="text-sm text-orange-100 font-medium">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-3xl font-bold font-mono tracking-wider">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Saldo Simpanan */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Saldo Simpanan</p>
                                <p className="text-2xl font-bold text-gray-900">Rp {Number(stats.saldo || 0).toLocaleString('id-ID')}</p>
                                <p className="text-xs text-green-600 mt-1">Aset Anda</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Estimasi SHU */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Estimasi SHU</p>
                                <p className="text-2xl font-bold text-gray-900">Rp {Number(stats.shu || 0).toLocaleString('id-ID')}</p>
                                <p className="text-xs text-blue-600 mt-1">Keuntungan Tahun Ini</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Total Hutang - Clickable */}
                    <div
                        onClick={() => router.push('/anggota/hutang')}
                        className="bg-white p-4 rounded-3xl shadow-sm border border-orange-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2.5 rounded-full text-red-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Total Hutang</p>
                                <p className="text-lg font-bold text-gray-800">Rp {stats.hutang.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        <div className="text-red-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Recent Transactions (Mimics the Chart area) */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <History size={20} className="text-orange-500" />
                                Riwayat Transaksi
                            </h3>
                            <button
                                onClick={() => router.push('/anggota/transaksi')}
                                className="text-sm text-orange-600 font-medium hover:underline flex items-center"
                            >
                                Lihat Semua <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentTx.length > 0 ? (
                                recentTx.map((tx) => (
                                    <div key={tx.transaksi_id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                                                <ShoppingBag size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm truncate max-w-[200px]">
                                                    {tx.items && tx.items.length > 0
                                                        ? `${tx.items[0].nama_barang} ${tx.items.length > 1 ? `(+${tx.items.length - 1} lainnya)` : ''}`
                                                        : 'Belanja Koperasi'
                                                    }
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-medium">
                                                    {new Date(tx.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800 text-sm">- Rp {Number(tx.total_harga).toLocaleString('id-ID')}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${tx.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-400">
                                    <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>Belum ada riwayat transaksi.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Member Features (Digital Card & Info) */}
                    <div className="space-y-6">
                        {/* Digital Member Card */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                            {/* Card Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Kartu Anggota Digital</p>
                                        <h3 className="text-lg font-bold mt-1">Koperasi PK</h3>
                                    </div>
                                    <div className="w-8 h-8 opacity-50">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                        </svg>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-center">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <QrCode size={64} className="text-slate-900" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase">Nama Anggota</p>
                                        <p className="font-bold text-sm truncate max-w-[150px]">{user?.nama_lengkap || user?.username}</p>

                                        <p className="text-[10px] text-slate-400 uppercase mt-2">ID Anggota</p>
                                        <p className="font-mono text-sm tracking-widest text-orange-400">
                                            {String(user?.user_id).padStart(8, '0')}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
                                    <p className="text-[10px] text-slate-500">Tunjukkan QR ini di kasir</p>
                                    <div className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold text-orange-200">
                                        ACTIVE
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Topup Button (Kept as distinct feature) */}
                        <button
                            onClick={() => router.push('/anggota/topup')}
                            className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition cursor-pointer text-left group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-500 transition-colors duration-300">
                                    <TrendingUp className="w-6 h-6 text-green-600 group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition">Topup Saldo</p>
                                    <p className="text-xs text-gray-500">Isi saldo via WhatsApp</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-full group-hover:bg-green-50">
                                <ChevronRight size={20} className="text-gray-400 group-hover:text-green-500" />
                            </div>
                        </button>

                        {/* Info Koperasi Widget */}
                        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <h4 className="font-bold text-blue-800 text-sm">Info Koperasi</h4>
                            </div>
                            <div className="space-y-3">
                                {announcements.length > 0 ? (
                                    announcements.map((info: any) => (
                                        <div key={info.id} className={`p-3 rounded-xl border shadow-sm ${info.kategori === 'promo'
                                            ? 'bg-orange-50 border-orange-100'
                                            : 'bg-white border-blue-100 opacity-90'
                                            }`}>
                                            <p className={`font-bold text-xs mb-1 ${info.kategori === 'promo' ? 'text-orange-800' : 'text-gray-800'
                                                }`}>
                                                {info.judul}
                                            </p>
                                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                                {info.konten}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-4 text-gray-400 text-xs">
                                        Tidak ada info terbaru.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
