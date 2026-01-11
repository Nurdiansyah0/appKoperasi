'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '@/utils/api';

interface TopupRequest {
    topup_id: number;
    nominal: number;
    status: string;
    created_at: string;
}

export default function TopupPage() {
    const router = useRouter();
    const [nominal, setNominal] = useState('');
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<TopupRequest[]>([]);

    // Koperasi Bank Details
    const bankDetails = {
        bank: 'MANDIRI',
        number: '1090023809551',
        name: 'Suryadi'
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response: any = await api.get('/anggota/topup');
            if (response.success) {
                setRequests(response.data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\\D/g, '');
        if (val) {
            setNominal(Number(val).toLocaleString('id-ID'));
        } else {
            setNominal('');
        }
    };

    const handleSubmit = async () => {
        if (!nominal) return;

        const result = await Swal.fire({
            title: 'Konfirmasi Topup',
            html: `
                <p>Anda akan mengajukan topup sebesar:</p>
                <p class="text-2xl font-bold text-green-600">Rp ${nominal}</p>
                <p class="text-sm text-gray-500 mt-2">Silakan transfer ke rekening:</p>
                <p class="font-bold">${bankDetails.bank} ${bankDetails.number}</p>
                <p class="text-sm">${bankDetails.name}</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Ajukan',
            confirmButtonColor: '#22c55e'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            // Remove dots (thousand separators) and parse as number
            const numericValue = nominal.replace(/\./g, '');

            const response: any = await api.post('/anggota/topup', {
                nominal: numericValue
            });

            if (response.success) {
                Swal.fire('Berhasil', 'Permintaan topup berhasil diajukan. Silakan transfer dan tunggu persetujuan kasir.', 'success');
                setNominal('');
                fetchRequests();
            } else {
                Swal.fire('Gagal', response.error, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal mengajukan topup', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved': return 'Disetujui';
            case 'rejected': return 'Ditolak';
            default: return 'Menunggu';
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">Topup Saldo</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Nominal Input */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Nominal Topup</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                        <input
                            type="text"
                            value={nominal}
                            onChange={handleNominalChange}
                            placeholder="0"
                            className="w-full pl-12 pr-4 py-4 text-2xl font-bold text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-300"
                        />
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {['50.000', '100.000', '200.000'].map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setNominal(amt)}
                                className="py-2 px-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition"
                            >
                                {amt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transfer Info */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Transfer ke Rekening</h3>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-12 h-8 bg-blue-800 rounded flex items-center justify-center text-white text-[10px] font-bold tracking-wider">
                            {bankDetails.bank}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">{bankDetails.name}</p>
                            <p className="text-lg font-bold text-gray-800 tracking-wide">{bankDetails.number}</p>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 leading-relaxed">
                        <span className="font-bold">Info:</span> Setelah transfer, permintaan Anda akan diproses oleh kasir.
                    </div>
                </div>

                {/* Request History */}
                {requests.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Riwayat Permintaan</h3>
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <div key={req.topup_id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-gray-900">Rp {req.nominal.toLocaleString('id-ID')}</p>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(req.status)}`}>
                                            {getStatusText(req.status)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {new Date(req.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 max-w-md mx-auto">
                <button
                    onClick={handleSubmit}
                    disabled={!nominal || nominal === '0' || loading}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                        ${!nominal || nominal === '0' || loading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-600 active:scale-95'
                        }
                    `}
                >
                    <CheckCircle size={20} />
                    {loading ? 'Mengajukan...' : 'Ajukan Topup'}
                </button>
            </div>
        </div>
    );
}
