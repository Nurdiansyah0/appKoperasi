// src/pages/kasir/tabs/DashboardTab.jsx - Dashboard with Product Modal
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../utils/api';

const DashboardTab = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const isMountedRef = useRef(true);

    const loadOrders = useCallback(async () => {
        try {
            const res = await api('getPesananAnggota', 'GET');
            if (isMountedRef.current && res?.success) {
                setOrders(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
            console.error('Error loading orders:', err);
        }
    }, []);

    const loadTransactions = useCallback(async () => {
        try {
            const res = await api('getTransaksiTerbaru', 'GET');
            if (isMountedRef.current && res?.success) {
                setRecentTransactions(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
            console.error('Error loading transactions:', err);
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        const loadData = async () => {
            setLoading(true);
            await Promise.all([loadOrders(), loadTransactions()]);
            setLoading(false);
        };
        loadData();

        const interval = setInterval(() => {
            if (isMountedRef.current) {
                loadOrders();
                loadTransactions();
            }
        }, 10000);

        return () => {
            isMountedRef.current = false;
            clearInterval(interval);
        };
    }, [loadOrders, loadTransactions]);

    const addToCart = (order) => {
        const existingInCart = cart.some(c => c.transaksi_id === order.transaksi_id);
        if (existingInCart) {
            alert('Pesanan ini sudah dalam proses!');
            return;
        }
        setCart(prev => [...prev, order]);
    };

    const completeOrders = async () => {
        if (cart.length === 0) {
            alert('Tidak ada pesanan untuk diproses!');
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                transaksi: cart.map(order => ({
                    transaksi_id: Number(order.transaksi_id)
                }))
            };

            const res = await api('simpanTransaksiKasir', 'POST', payload);

            if (res && res.success) {
                alert(`Berhasil! ${res.processed_count} transaksi diselesaikan.`);
                setCart([]);
                loadOrders();
                loadTransactions();
            } else {
                throw new Error(res?.message || 'Gagal memproses transaksi');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Terjadi kesalahan saat memproses transaksi');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleShowProducts = (transaction) => {
        setSelectedTransaction(transaction);
        setShowProductModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pesanan Anggota */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    Pesanan Anggota
                </h3>

                {orders.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <p className="text-gray-500">Tidak ada pesanan yang menunggu</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orders.map((order) => (
                            <div key={order.transaksi_id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{order.nama_anggota}</h4>
                                        <p className="text-sm text-gray-500">ID: #{order.transaksi_id}</p>
                                    </div>
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                        {order.metode_pembayaran}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <p className="text-sm text-gray-600 mb-1">Items:</p>
                                    <ul className="text-sm space-y-1">
                                        {(order.items || []).slice(0, 3).map((item, idx) => (
                                            <li key={idx} className="text-gray-700">
                                                • {item.nama_barang} ({item.jumlah}x)
                                            </li>
                                        ))}
                                        {order.items && order.items.length > 3 && (
                                            <li className="text-gray-500 text-xs">+{order.items.length - 3} lainnya</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="font-bold text-gray-800">
                                        {formatCurrency(Number(order.total_harga))}
                                    </span>
                                    <button
                                        onClick={() => addToCart(order)}
                                        className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                                    >
                                        Proses
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sedang Diproses */}
            {cart.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">⏳</span>
                        Sedang Diproses ({cart.length})
                    </h3>

                    <div className="space-y-2 mb-4">
                        {cart.map((order, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg">
                                <div>
                                    <span className="font-medium text-gray-800">{order.nama_anggota}</span>
                                    <span className="text-sm text-gray-500 ml-2">#{order.transaksi_id}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-800">{formatCurrency(Number(order.total_harga))}</span>
                                    <button
                                        onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={completeOrders}
                        disabled={processing}
                        className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Memproses...' : `Selesaikan ${cart.length} Pesanan`}
                    </button>
                </div>
            )}

            {/* Transaksi Terbaru */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">📜</span>
                    Transaksi Terbaru
                </h3>

                {recentTransactions.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <p className="text-gray-500">Belum ada transaksi hari ini</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anggota</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {recentTransactions.slice(0, 10).map((trx) => (
                                    <tr key={trx.id || trx.transaksi_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">#{trx.id || trx.transaksi_id}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{trx.nama_anggota || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {trx.items && Array.isArray(trx.items) && trx.items.length > 0 ? (
                                                <div
                                                    className="max-w-xs cursor-pointer hover:text-orange-600 transition-colors"
                                                    onClick={() => handleShowProducts(trx)}
                                                >
                                                    {trx.items.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="text-xs">
                                                            • {item.nama_barang || item.nama_item} ({item.jumlah}x)
                                                        </div>
                                                    ))}
                                                    {trx.items.length > 2 && (
                                                        <div className="text-xs text-orange-600 font-semibold hover:underline">
                                                            +{trx.items.length - 2} lainnya (klik detail)
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                {trx.metode_pembayaran || trx.metode || 'Tunai'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                            {formatCurrency(Number(trx.total || trx.total_harga))}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {formatDate(trx.created_at || trx.tanggal)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                {trx.status || 'Selesai'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Product Details Modal */}
            {showProductModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowProductModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">
                                Detail Produk - Transaksi #{selectedTransaction.id || selectedTransaction.transaksi_id}
                            </h3>
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="text-white hover:text-gray-200 transition-colors text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedTransaction.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{item.nama_barang || item.nama_item}</p>
                                                <p className="text-sm text-gray-600">
                                                    {formatCurrency(item.harga_satuan)} × {item.jumlah}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-orange-600">
                                                    {formatCurrency(item.harga_satuan * item.jumlah)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="border-t-2 border-gray-200 pt-4 mt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-900">Total:</span>
                                            <span className="text-2xl font-bold text-orange-600">
                                                {formatCurrency(Number(selectedTransaction.total || selectedTransaction.total_harga))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Tidak ada detail produk</p>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardTab;
