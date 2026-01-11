'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface PendingOrder {
    transaksi_id: number;
    anggota_nama: string;
    total_harga: number;
    metode_pembayaran: string;
    created_at: string;
    items: {
        nama_barang: string;
        jumlah: number;
        harga_satuan: number;
        subtotal: number;
    }[];
}

export default function KasirPendingOrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<PendingOrder[]>([]);

    useEffect(() => {
        fetchOrders();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            fetchOrders();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/kasir/pesanan/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setOrders(result.data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (transaksi_id: number, anggota_nama: string, total: number) => {
        const result = await Swal.fire({
            title: 'Selesaikan Pesanan?',
            html: `
                <p>Pesanan dari: <strong>${anggota_nama}</strong></p>
                <p>Total: <strong>Rp ${total.toLocaleString('id-ID')}</strong></p>
                <p class="text-sm text-gray-500 mt-2">Pastikan barang sudah diserahkan ke pelanggan</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Selesaikan',
            confirmButtonColor: '#22c55e'
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/kasir/pesanan/pending', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ transaksi_id })
            });
            const resData = await response.json();

            if (resData.success) {
                Swal.fire('Berhasil', 'Pesanan telah diselesaikan', 'success');
                fetchOrders();
            } else {
                Swal.fire('Gagal', resData.error, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal memproses pesanan', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Pesanan Pending</h1>
                <p className="text-gray-500 text-sm">Pesanan menunggu untuk diselesaikan</p>
            </header>

            <main>
                {orders.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
                        <div className="inline-block p-4 bg-green-50 rounded-full mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Semua Pesanan Selesai!</h3>
                        <p className="text-gray-500">Tidak ada pesanan yang menunggu.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {orders.map((order) => (
                            <div key={order.transaksi_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{order.anggota_nama}</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Total</p>
                                        <p className="text-xl font-bold text-green-600">Rp {order.total_harga.toLocaleString('id-ID')}</p>
                                        <p className="text-xs text-gray-500 mt-1 capitalize">{order.metode_pembayaran}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 mb-4">
                                    <p className="text-xs font-bold text-gray-700 mb-2">Detail Pesanan:</p>
                                    <div className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-700">{item.nama_barang} x{item.jumlah}</span>
                                                <span className="font-semibold text-gray-900">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleComplete(order.transaksi_id, order.anggota_nama, order.total_harga)}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-sm"
                                >
                                    Selesaikan Pesanan
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
