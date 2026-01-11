'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import api from '@/utils/api';
import { motion } from 'framer-motion';

interface HutangHistory {
    pembayaran_id: number;
    nominal: number;
    status: string;
    created_at: string;
    approved_at?: string;
}

export default function BayarHutangPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentHutang, setCurrentHutang] = useState(0);
    const [history, setHistory] = useState<HutangHistory[]>([]);
    const [nominal, setNominal] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response: any = await api.get('/anggota/hutang');
            if (response.success) {
                setCurrentHutang(response.data.current_hutang);
                setHistory(response.data.history);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Optionally handle error, but for now we just stop loading
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = parseInt(nominal.replace(/\D/g, ''));

        if (!amount || amount <= 0) {
            Swal.fire('Error', 'Masukkan nominal yang valid', 'error');
            return;
        }

        if (amount > currentHutang) {
            Swal.fire('Warning', 'Nominal melebihi total hutang Anda', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const response: any = await api.post('/anggota/hutang', { nominal: amount });
            if (response.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Permintaan pembayaran berhasil dikirim. Silakan tunggu konfirmasi Kasir.',
                    confirmButtonColor: '#f97316'
                });
                setNominal('');
                fetchData(); // Refresh data
            } else {
                Swal.fire('Error', response.error || 'Gagal memproses permintaan', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan sistem', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 pb-12 rounded-b-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-10 -mb-10"></div>

                <div className="relative z-10">
                    <button
                        onClick={() => router.back()}
                        className="mb-4 flex items-center text-orange-100 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali
                    </button>
                    <h1 className="text-2xl font-bold mb-1">Bayar Hutang</h1>
                    <p className="text-orange-100 text-sm opacity-90">Kelola tagihan Anda</p>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 -mt-8 relative z-20 space-y-4">
                {/* Total Debt Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-red-500"
                >
                    <p className="text-sm text-gray-500 mb-1">Total Tagihan Belum Lunas</p>
                    <p className="text-3xl font-bold text-gray-800">Rp {currentHutang.toLocaleString('id-ID')}</p>
                </motion.div>

                {/* Payment Form */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl shadow-sm p-6"
                >
                    <h2 className="font-bold text-gray-800 mb-4">Buat Pembayaran Baru</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Pembayaran</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={nominal ? parseInt(nominal.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                                    onChange={(e) => setNominal(e.target.value.replace(/\D/g, ''))}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-800 font-semibold text-lg placeholder-gray-400"
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                *Pembayaran akan diproses setelah Anda melakukan transfer/setor tunai dan dikonfirmasi Kasir.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || !nominal}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95
                                ${submitting || !nominal
                                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-orange-200'}`}
                        >
                            {submitting ? 'Memproses...' : 'Ajukan Pembayaran'}
                        </button>
                    </form>
                </motion.div>

                {/* History List */}
                <div className="space-y-3 pt-2">
                    <h3 className="font-bold text-gray-800 ml-1">Riwayat Pengajuan</h3>

                    {history.length > 0 ? (
                        history.map((item) => (
                            <motion.div
                                key={item.pembayaran_id}
                                layout
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-bold text-gray-800">Rp {item.nominal.toLocaleString('id-ID')}</p>
                                    <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}</p>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                        ${item.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'}`}
                                    >
                                        {item.status === 'approved' ? 'Lunas' :
                                            item.status === 'rejected' ? 'Ditolak' : 'Proses'}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            Belum ada riwayat pembayaran
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
