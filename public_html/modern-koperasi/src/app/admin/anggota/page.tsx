'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Anggota {
    anggota_id: number;
    username: string;
    saldo: number;
    hutang: number;
    shu: number;
}

export default function DataAnggota() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                router.push('/login');
                return;
            }

            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'admin') {
                alert('Unauthorized access');
                router.push('/login');
                return;
            }

            setUser(parsedUser);
            fetchData(token);
        };

        checkAuth();
    }, [router]);

    const fetchData = async (token: string) => {
        try {
            const response = await fetch('/api/admin/anggota', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                setAnggotaList(result.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const [showTopupModal, setShowTopupModal] = useState(false);
    const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);
    const [topupAmount, setTopupAmount] = useState('');

    const handleOpenTopup = (anggota: Anggota) => {
        setSelectedAnggota(anggota);
        setTopupAmount('');
        setShowTopupModal(true);
    };

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAnggota) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/admin/topup-shu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: selectedAnggota.username,
                    nominal: Number(topupAmount)
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Topup berhasil!');
                setShowTopupModal(false);
                fetchData(token); // Refresh data
            } else {
                alert(result.error || 'Topup gagal');
            }
        } catch (error) {
            console.error('Error topup:', error);
            alert('Terjadi kesalahan saat topup');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Data Anggota</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hutang</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SHU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {anggotaList.map((anggota) => (
                                    <tr key={anggota.anggota_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{anggota.anggota_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{anggota.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {anggota.saldo.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">Rp {anggota.hutang.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">Rp {anggota.shu.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenTopup(anggota)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                                            >
                                                Pindahkan SHU
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {anggotaList.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Belum ada data anggota.
                        </div>
                    )}
                </div>
            </main>

            {/* Topup Modal */}
            {showTopupModal && selectedAnggota && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Pindahkan SHU ke Saldo</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Aggota: <span className="font-semibold">{selectedAnggota.username}</span><br />
                            SHU Tersedia: <span className="font-semibold text-green-600">Rp {selectedAnggota.shu.toLocaleString('id-ID')}</span>
                        </p>
                        <form onSubmit={handleTopup}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedAnggota.shu}
                                    value={topupAmount}
                                    onChange={(e) => setTopupAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="Masukkan nominal (contoh: 50000)"
                                />
                                {topupAmount && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Akan dipindahkan: Rp {Number(topupAmount).toLocaleString('id-ID')}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowTopupModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                                >
                                    Proses
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
