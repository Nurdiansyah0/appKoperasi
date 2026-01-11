'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface TopupRequest {
    topup_id: number;
    nominal: number;
    created_at: string;
    anggota: {
        nama_lengkap: string;
        saldo: number;
    };
}

export default function KasirTopupApprovalPage() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<TopupRequest[]>([]);

    useEffect(() => {
        fetchRequests();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            fetchRequests();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/kasir/topup/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setRequests(result.data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: 'approve' | 'reject', nama: string, nominal: number) => {
        const result = await Swal.fire({
            title: action === 'approve' ? 'Setujui Topup?' : 'Tolak Topup?',
            text: action === 'approve'
                ? `Konfirmasi topup Rp ${nominal.toLocaleString('id-ID')} untuk ${nama}?`
                : `Tolak permintaan topup dari ${nama}?`,
            icon: action === 'approve' ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonText: action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak',
            confirmButtonColor: action === 'approve' ? '#22c55e' : '#ef4444'
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/kasir/topup/pending', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ topup_id: id, action })
            });
            const resData = await response.json();

            if (resData.success) {
                Swal.fire('Berhasil', resData.message, 'success');
                fetchRequests();
            } else {
                Swal.fire('Gagal', resData.error, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal memproses', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Persetujuan Topup Saldo</h1>
                <p className="text-gray-500 text-sm">Validasi permintaan topup dari anggota</p>
            </header>

            <main>
                {requests.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
                        <div className="inline-block p-4 bg-green-50 rounded-full mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Semua Beres!</h3>
                        <p className="text-gray-500">Tidak ada permintaan topup yang menunggu.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((req) => (
                            <div key={req.topup_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{req.anggota.nama_lengkap || 'Anggota'}</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Nominal: <span className="font-bold text-green-600 text-lg">Rp {req.nominal.toLocaleString('id-ID')}</span>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Saldo saat ini: Rp {req.anggota.saldo.toLocaleString('id-ID')}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Diajukan: {new Date(req.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleAction(req.topup_id, 'reject', req.anggota.nama_lengkap, req.nominal)}
                                        className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.topup_id, 'approve', req.anggota.nama_lengkap, req.nominal)}
                                        className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                    >
                                        Setujui Topup
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
