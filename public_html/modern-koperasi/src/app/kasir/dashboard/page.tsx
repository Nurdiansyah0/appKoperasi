'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Swal from 'sweetalert2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

interface DashboardStats {
    pendapatan_hari_ini: number;
    growth_hari_ini: number;
    pendapatan_minggu_ini: number;
    growth_minggu_ini: number;
    pendapatan_bulan_ini: number;
    growth_bulan_ini: number;
    total_pesanan: number;
    stok_menipis: number;
    trend_bulanan: { label: string; value: number }[];
}

const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
        <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(value)}%</span>
        </div>
    );
};

export default function KasirDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        pendapatan_hari_ini: 0,
        growth_hari_ini: 0,
        pendapatan_minggu_ini: 0,
        growth_minggu_ini: 0,
        pendapatan_bulan_ini: 0,
        growth_bulan_ini: 0,
        total_pesanan: 0,
        stok_menipis: 0,
        trend_bulanan: []
    });
    const [user, setUser] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                router.push('/login');
                return;
            }

            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'kasir' && parsedUser.role !== 'admin') {
                await Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak',
                    text: 'Anda tidak memiliki hak akses ke halaman ini.',
                    confirmButtonColor: '#f97316'
                });
                router.push('/login');
                return;
            }

            setUser(parsedUser);
            fetchStats(token);
        };

        checkAuth();
    }, [router]);

    const fetchStats = async (token: string) => {
        try {
            const response = await fetch('/api/kasir/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };



    const chartData = {
        labels: stats.trend_bulanan.map(t => t.label),
        datasets: [
            {
                label: 'Pendapatan Bulanan',
                data: stats.trend_bulanan.map(t => t.value),
                borderColor: 'rgb(249, 115, 22)', // Orange-500
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(249, 115, 22)', // Full orange point
                pointBorderColor: 'rgb(255, 255, 255)',  // White border
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.4 // Smooth curve
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 0,
                right: 0
            }
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'TREND PENDAPATAN BULANAN',
                font: { size: 16, weight: 800 },
                color: '#111827', // Darker gray-900
                padding: { bottom: 35 }
            },
            datalabels: {
                display: true,
                color: '#6366f1', // Indigo-500 for better visibility as dots/labels
                align: 'top' as const,
                anchor: 'end' as const,
                offset: 2,
                font: {
                    size: 9,
                    weight: 'bold' as const
                },
                formatter: (value: number) => {
                    // Format thousands (k) or millions (jt)
                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'jt';
                    if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                    return value;
                }
            }
        },
        scales: {
            y: {
                display: true,
                beginAtZero: true,
                border: { display: false },
                grid: {
                    color: '#f3f4f6',
                    display: true
                },
                ticks: { display: false }
            },
            x: {
                display: true,
                border: { display: false },
                grid: {
                    color: '#f3f4f6',
                    display: true
                },
                ticks: { display: true, font: { size: 9 } }
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
            {/* Welcome Banner */}


            {/* KPI Section Inline Left */}
            <div className="bg-white p-1.5 sm:p-3 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
                <div className="flex flex-wrap items-end gap-4 sm:gap-8">
                    {/* Hari Ini */}
                    <div className="text-left">
                        <p className="text-[11px] sm:text-xs text-gray-800 uppercase tracking-wider font-extrabold">HARI INI</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-950 mt-0.5">Rp {stats.pendapatan_hari_ini.toLocaleString('id-ID')}</p>
                        <GrowthIndicator value={stats.growth_hari_ini} />
                    </div>

                    {/* Minggu Ini */}
                    <div className="text-left">
                        <p className="text-[11px] sm:text-xs text-gray-800 uppercase tracking-wider font-extrabold">MINGGU INI</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-950 mt-0.5">Rp {stats.pendapatan_minggu_ini.toLocaleString('id-ID')}</p>
                        <GrowthIndicator value={stats.growth_minggu_ini} />
                    </div>

                    {/* Bulan Ini */}
                    <div className="text-left">
                        <p className="text-[11px] sm:text-xs text-gray-800 uppercase tracking-wider font-extrabold">BULAN INI</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-950 mt-0.5">Rp {stats.pendapatan_bulan_ini.toLocaleString('id-ID')}</p>
                        <GrowthIndicator value={stats.growth_bulan_ini} />
                    </div>
                </div>
            </div>

            {/* Operational Stats & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
                {/* Chart Section - Takes up 2 columns */}
                <div className="lg:col-span-2 bg-white pt-2 sm:pt-4 pb-2 sm:pb-4 pr-0 pl-0 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 h-[400px] sm:h-[500px]">
                    <div className="w-full h-full">
                        <Line options={chartOptions} data={chartData} />
                    </div>
                </div>

                {/* Right Side Stats */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Pesanan Pending Card */}
                    <div
                        onClick={() => router.push('/kasir/pesanan')}
                        className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-yellow-300 transition cursor-pointer active:scale-95"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500">Pesanan Pending</p>
                                <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.total_pesanan}</p>
                                <p className="text-xs text-yellow-600 mt-0.5 sm:mt-1">Click to view</p>
                            </div>
                        </div>
                    </div>

                    {/* Stok Menipis Card */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500">Stok Menipis</p>
                                <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.stok_menipis}</p>
                                <p className="text-xs text-red-600 mt-0.5 sm:mt-1">Perlu restock</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
