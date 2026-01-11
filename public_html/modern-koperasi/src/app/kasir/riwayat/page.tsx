'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface TransactionItem {
    barang_id: number;
    nama_barang: string;
    jumlah: number;
    harga_satuan: number;
    subtotal: number;
}

interface Transaction {
    transaksi_id: number;
    created_at: string;
    total_harga: number;
    status: string;
    nama_anggota?: string;
    metode_pembayaran: string;
    items: TransactionItem[];
}

export default function RiwayatPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
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
            if (parsedUser.role !== 'kasir' && parsedUser.role !== 'admin') {
                alert('Unauthorized access');
                router.push('/login');
                return;
            }

            setUser(parsedUser);
            fetchHistory(token);
        };

        checkAuth();
    }, [router]);

    const fetchHistory = async (token: string) => {
        try {
            const response = await fetch('/api/kasir/history?limit=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setTransactions(result.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anggota</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((tx) => (
                                    <tr key={tx.transaksi_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{tx.transaksi_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tx.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {tx.nama_anggota || 'Umum (Guest)'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            Rp {tx.total_harga.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {tx.metode_pembayaran}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${tx.status === 'selesai' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Detail
                                                </button>
                                                {(tx.status === 'pending' || tx.status === 'on_process') && (
                                                    <button
                                                        onClick={async () => {
                                                            const result = await Swal.fire({
                                                                title: 'Complete Order?',
                                                                text: `Mark order #${tx.transaksi_id} as completed?`,
                                                                icon: 'question',
                                                                showCancelButton: true,
                                                                confirmButtonColor: '#10b981',
                                                                cancelButtonColor: '#6b7280',
                                                                confirmButtonText: 'Yes, complete it!'
                                                            });

                                                            if (!result.isConfirmed) return;

                                                            const token = localStorage.getItem('token');
                                                            try {
                                                                const response = await fetch('/api/kasir/transaksi/complete', {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        'Authorization': `Bearer ${token}`
                                                                    },
                                                                    body: JSON.stringify({
                                                                        transaksi: [{ transaksi_id: tx.transaksi_id }]
                                                                    })
                                                                });

                                                                const apiResult = await response.json();
                                                                if (apiResult.success) {
                                                                    await Swal.fire({
                                                                        icon: 'success',
                                                                        title: 'Success!',
                                                                        text: 'Order completed successfully',
                                                                        timer: 1500,
                                                                        showConfirmButton: false
                                                                    });
                                                                    fetchHistory(token as string);
                                                                } else {
                                                                    Swal.fire({
                                                                        icon: 'error',
                                                                        title: 'Failed',
                                                                        text: apiResult.error || 'Unknown error'
                                                                    });
                                                                }
                                                            } catch (error) {
                                                                console.error('Error completing order:', error);
                                                                Swal.fire({
                                                                    icon: 'error',
                                                                    title: 'Error',
                                                                    text: 'Failed to complete order'
                                                                });
                                                            }
                                                        }}
                                                        className="text-green-600 hover:text-green-900 font-medium"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {transactions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Belum ada riwayat transaksi.
                        </div>
                    )}
                </div>
            </main>

            {/* Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Detail Transaksi #{selectedTx.transaksi_id}</h3>
                                <p className="text-sm text-gray-500">{new Date(selectedTx.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="border-t border-b border-gray-200 py-4 mb-4">
                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <span className="text-gray-500">Pelanggan:</span>
                                <span className="font-medium text-right text-gray-900">{selectedTx.nama_anggota || 'Umum'}</span>
                                <span className="text-gray-500">Metode Bayar:</span>
                                <span className="font-medium text-right text-gray-900 capitalize">{selectedTx.metode_pembayaran}</span>
                                <span className="text-gray-500">Status:</span>
                                <span className="font-medium text-right text-gray-900 capitalize">{selectedTx.status}</span>
                            </div>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-100">
                                        <th className="text-left py-2 font-normal">Item</th>
                                        <th className="text-center py-2 font-normal">Qty</th>
                                        <th className="text-right py-2 font-normal">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTx.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 last:border-0">
                                            <td className="py-2 text-gray-900">
                                                {item.nama_barang}
                                                <div className="text-xs text-gray-400">@ {item.harga_satuan.toLocaleString('id-ID')}</div>
                                            </td>
                                            <td className="py-2 text-center text-gray-900">{item.jumlah}</td>
                                            <td className="py-2 text-right text-gray-900 font-medium">
                                                {item.subtotal.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <span className="text-lg font-bold text-gray-900">Total Akhir</span>
                            <span className="text-xl font-bold text-blue-600">Rp {selectedTx.total_harga.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cetak
                            </button>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
