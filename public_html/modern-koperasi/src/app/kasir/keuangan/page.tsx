'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface Payment {
    pembayaran_id: number;
    anggota_id: number;
    nama_anggota: string;
    nominal: number;
    status: string;
    created_at: string;
}

interface Anggota {
    anggota_id: number;
    username: string;
    nama_lengkap?: string;
    saldo: number;
    hutang: number;
}

export default function KeuanganPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'hutang' | 'tarik' | 'setor' | 'topup'>('hutang');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [members, setMembers] = useState<Anggota[]>([]);
    const [user, setUser] = useState<any>(null);

    // Form States
    const [tarikMemberId, setTarikMemberId] = useState('');
    const [tarikNominal, setTarikNominal] = useState('');
    const [setorNominal, setSetorNominal] = useState('');

    // Search
    const [memberSearch, setMemberSearch] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);

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
                alert('Unauthorized access');
                router.push('/login');
                return;
            }

            setUser(parsedUser);
            await fetchPayments(token);
            await fetchMembers(token);
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const fetchPayments = async (token: string) => {
        try {
            const response = await fetch('/api/kasir/keuangan/pembayaran-hutang', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) setPayments(result.data);
        } catch (error) {
            console.error('Error payments:', error);
        }
    };

    const fetchMembers = async (token: string) => {
        try {
            const response = await fetch('/api/kasir/anggota', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) setMembers(result.data);
        } catch (error) {
            console.error('Error members:', error);
        }
    };

    const handleApproveReject = async (id: number, action: 'approve' | 'reject') => {
        const result = await Swal.fire({
            title: `Konfirmasi ${action === 'approve' ? 'Terima' : 'Tolak'}?`,
            text: `Yakin ingin ${action} pembayaran ini?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: action === 'approve' ? 'Ya, Terima' : 'Ya, Tolak',
            confirmButtonColor: action === 'approve' ? '#10B981' : '#EF4444'
        });

        if (!result.isConfirmed) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/kasir/keuangan/pembayaran-hutang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pembayaran_id: id, action })
            });
            const resData = await response.json();
            if (resData.success) {
                Swal.fire('Berhasil', `Pembayaran berhasil di-${action}`, 'success');
                fetchPayments(token!);
                fetchMembers(token!); // Refresh balances
            } else {
                Swal.fire('Gagal', resData.error, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal memproses', 'error');
        }
    };

    const handleTarikTunai = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/kasir/keuangan/tarik-tunai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ anggota_id: tarikMemberId, nominal: tarikNominal.replace(/\./g, '') })
            });

            const result = await response.json();
            if (result.success) {
                Swal.fire('Berhasil', 'Penarikan berhasil!', 'success');
                setTarikNominal('');
                setTarikMemberId('');
                setMemberSearch('');
                fetchMembers(token!);
            } else {
                Swal.fire('Gagal', result.error, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal memproses penarikan', 'error');
        }
    };

    const handleSetorAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/kasir/keuangan/setor-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nominal: setorNominal.replace(/\./g, '') })
            });

            const result = await response.json();
            if (result.success) {
                Swal.fire('Berhasil', 'Setoran berhasil diajukan!', 'success');
                setSetorNominal('');
            } else {
                Swal.fire('Gagal', result.error, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal memproses setoran', 'error');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Keuangan Kasir</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola hutang, tarik tunai, dan setoran</p>
                    </div>
                    {/* User Badge - Simplified since Sidebar handles main identity */}
                    <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                            {user?.username?.[0]?.toUpperCase() || 'K'}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-700">{user?.username || 'Kasir'}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{user?.role || 'Staff'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs - Pill Style */}
                <div className="flex p-1 space-x-1 bg-white rounded-xl shadow-sm border border-gray-200 mb-8 w-fit mx-auto md:mx-0">
                    <button
                        onClick={() => setActiveTab('hutang')}
                        className={`
                            px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2
                            ${activeTab === 'hutang'
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                            }
                        `}
                    >
                        Approve Hutang
                    </button>
                    <button
                        onClick={() => setActiveTab('tarik')}
                        className={`
                            px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2
                            ${activeTab === 'tarik'
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                            }
                        `}
                    >
                        Tarik Tunai
                    </button>
                    <button
                        onClick={() => setActiveTab('setor')}
                        className={`
                            px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2
                            ${activeTab === 'setor'
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                            }
                        `}
                    >
                        Setor ke Admin
                    </button>
                    <button
                        onClick={() => router.push('/kasir/keuangan/topup')}
                        className="px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                    >
                        Approve Topup
                    </button>
                </div>

                {/* Content Area */}
                <div className="transition-all duration-300 ease-in-out">
                    {activeTab === 'hutang' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-800">Pembayaran Hutang Pending</h3>
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                                    {payments.filter(p => p.status === 'pending').length} Requests
                                </span>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {payments.filter(p => p.status === 'pending').map(payment => (
                                    <li key={payment.pembayaran_id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                                    {payment.nama_anggota?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-base">{payment.nama_anggota}</p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Nominal Pembayaran: <span className="font-bold text-green-600 text-lg ml-1">Rp {Number(payment.nominal).toLocaleString('id-ID')}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">
                                                        {new Date(payment.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleApproveReject(payment.pembayaran_id, 'reject')}
                                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 text-sm font-bold transition-colors"
                                                >
                                                    Tolak
                                                </button>
                                                <button
                                                    onClick={() => handleApproveReject(payment.pembayaran_id, 'approve')}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm shadow-green-200 text-sm font-bold transition-all transform hover:-translate-y-0.5"
                                                >
                                                    Terima Pembayaran
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {payments.filter(p => p.status === 'pending').length === 0 && (
                                    <li className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-lg font-medium text-gray-500">Semua Bersih!</p>
                                            <p className="text-sm">Tidak ada pembayaran hutang yang menunggu konfirmasi.</p>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'tarik' && (
                        <div className="max-w-xl mx-auto">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white text-center">
                                    <h3 className="text-xl font-bold">Penarikan Saldo</h3>
                                    <p className="text-orange-100 text-sm mt-1">Formulir penarikan saldo anggota</p>
                                </div>
                                <div className="p-8">
                                    <form onSubmit={handleTarikTunai} className="space-y-6">
                                        <div className="relative">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Cari Anggota</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium text-gray-900 placeholder-gray-400"
                                                placeholder="Ketik nama anggota..."
                                                value={memberSearch}
                                                onChange={(e) => {
                                                    setMemberSearch(e.target.value);
                                                    setShowMemberDropdown(true);
                                                    if (tarikMemberId) setTarikMemberId('');
                                                }}
                                                onFocus={() => setShowMemberDropdown(true)}
                                                onBlur={() => setTimeout(() => setShowMemberDropdown(false), 200)}
                                            />
                                            {showMemberDropdown && memberSearch && !tarikMemberId && (
                                                <div className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto divide-y divide-gray-50">
                                                    {members.filter(m => m.username.toLowerCase().includes(memberSearch.toLowerCase()) || (m.nama_lengkap && m.nama_lengkap.toLowerCase().includes(memberSearch.toLowerCase()))).map(m => (
                                                        <div
                                                            key={m.anggota_id}
                                                            className="px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                setTarikMemberId(String(m.anggota_id));
                                                                setMemberSearch(`${m.username} (Saldo: Rp ${m.saldo.toLocaleString('id-ID')})`);
                                                                setShowMemberDropdown(false);
                                                            }}
                                                        >
                                                            <p className="text-sm font-bold text-gray-900">{m.username}</p>
                                                            <p className="text-xs text-green-600 font-bold mt-0.5">Saldo: Rp {m.saldo.toLocaleString('id-ID')}</p>
                                                        </div>
                                                    ))}
                                                    {members.filter(m => m.username.toLowerCase().includes(memberSearch.toLowerCase())).length === 0 && (
                                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Anggota tidak ditemukan</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nominal Penarikan</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 font-bold">Rp</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-bold text-lg text-gray-900 placeholder-gray-300"
                                                    placeholder="0"
                                                    value={tarikNominal}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val) {
                                                            setTarikNominal(Number(val).toLocaleString('id-ID'));
                                                        } else {
                                                            setTarikNominal('');
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 ml-1">Minimal penarikan Rp 20.000</p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!tarikMemberId || !tarikNominal}
                                            className={`
                                                w-full py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all transform hover:-translate-y-0.5
                                                ${!tarikMemberId || !tarikNominal
                                                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30'
                                                }
                                            `}
                                        >
                                            Proses Penarikan
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'setor' && (
                        <div className="max-w-xl mx-auto">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center">
                                    <h3 className="text-xl font-bold">Setor Tunai</h3>
                                    <p className="text-green-100 text-sm mt-1">Setor uang tunai harian ke Admin</p>
                                </div>
                                <div className="p-8">
                                    <form onSubmit={handleSetorAdmin} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nominal Setoran</label>
                                            <div className="relative rounded-xl shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 font-bold">Rp</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-bold text-lg text-gray-900 placeholder-gray-300"
                                                    placeholder="0"
                                                    value={setorNominal}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val) {
                                                            setSetorNominal(Number(val).toLocaleString('id-ID'));
                                                        } else {
                                                            setSetorNominal('');
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <p className="mt-3 text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-start gap-2">
                                                <svg className="w-5 h-5 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Pastikan uang fisik sudah dihitung dengan benar dan siap diserahkan ke Admin.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-green-500/30 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all transform hover:-translate-y-0.5"
                                        >
                                            Ajukan Setoran
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
