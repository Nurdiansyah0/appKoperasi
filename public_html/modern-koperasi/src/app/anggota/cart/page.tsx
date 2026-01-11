'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { Trash2, ShoppingBag, ArrowLeft, CreditCard, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

export default function CartPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [metode, setMetode] = useState('cash');
    const [loading, setLoading] = useState(false);
    const [saldo, setSaldo] = useState(0);
    const [hutangLimit, setHutangLimit] = useState({ limit: 0, current_hutang: 0, available: 0 });
    const [loadingSaldo, setLoadingSaldo] = useState(true);
    const router = useRouter();

    const totalHarga = cart.reduce((acc, curr) => acc + (curr.harga_jual * curr.jumlah), 0);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) setCart(JSON.parse(savedCart));
        fetchSaldo();
        fetchHutangLimit();
    }, []);

    const fetchSaldo = async () => {
        try {
            const response: any = await api.get('/anggota/profil');
            if (response.success) {
                setSaldo(response.data.saldo);
            }
        } catch (error) {
            console.error('Failed to fetch saldo', error);
        } finally {
            setLoadingSaldo(false);
        }
    };

    const fetchHutangLimit = async () => {
        try {
            const response: any = await api.get('/anggota/hutang-limit');
            if (response.success) {
                setHutangLimit(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch hutang limit', error);
        }
    };

    const updateQuantity = (id: number, delta: number) => {
        const newCart = cart.map(item => {
            if (item.barang_id === id) {
                const newQty = Math.max(1, item.jumlah + delta);
                return { ...item, jumlah: newQty };
            }
            return item;
        });
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const removeItem = (id: number) => {
        const newCart = cart.filter(item => item.barang_id !== id);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Validation based on payment method
        if (metode === 'saldo') {
            if (saldo < totalHarga) {
                Swal.fire({
                    icon: 'error',
                    title: 'Saldo Tidak Cukup',
                    text: `Saldo Anda: Rp ${saldo.toLocaleString('id-ID')}. Dibutuhkan: Rp ${totalHarga.toLocaleString('id-ID')}`
                });
                return;
            }
        } else if (metode === 'hutang') {
            if (hutangLimit.available < totalHarga) {
                Swal.fire({
                    icon: 'error',
                    title: 'Limit Hutang Tidak Cukup',
                    html: `
                        <p>Limit tersedia: Rp ${hutangLimit.available.toLocaleString('id-ID')}</p>
                        <p>Dibutuhkan: Rp ${totalHarga.toLocaleString('id-ID')}</p>
                    `
                });
                return;
            }
        }

        setLoading(true);

        try {
            const response: any = await api.post('/anggota/transaksi/create', {
                items: cart,
                total_harga: totalHarga,
                metode_pembayaran: metode
            });

            if (response.success) {
                localStorage.removeItem('cart');
                setCart([]);

                let successMessage = '';
                if (metode === 'saldo') {
                    successMessage = 'Pembayaran berhasil. Saldo Anda telah dikurangi.';
                } else if (metode === 'hutang') {
                    successMessage = 'Transaksi berhasil dicatat sebagai hutang.';
                } else {
                    successMessage = 'Pesanan berhasil dibuat. Silakan lakukan pembayaran.';
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Pesanan Dibuat',
                    text: successMessage,
                    confirmButtonText: 'Lihat Riwayat'
                }).then(() => {
                    router.push('/anggota/transaksi');
                });
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Checkout',
                text: error.sanitizedMessage || 'Terjadi kesalahan saat memproses pesanan'
            });
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <ShoppingBag size={48} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Keranjang Kosong</h2>
                <p className="text-slate-500 mb-8 text-center italic">Anda belum menambahkan barang ke keranjang.</p>
                <button
                    onClick={() => router.push('/anggota/belanja')}
                    className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                >
                    Mulai Belanja
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Keranjang Belanja</h1>
            </div>

            <div className="space-y-4 mb-8">
                {cart.map((item) => (
                    <motion.div
                        key={item.barang_id}
                        layout
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">{item.nama_barang}</h3>
                                <p className="text-orange-600 font-bold text-xs mt-1">Rp {Number(item.harga_jual).toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                                <button onClick={() => updateQuantity(item.barang_id, -1)} className="p-1 hover:text-orange-500"><ArrowLeft size={16} className="-rotate-90 lg:rotate-0" /></button>
                                <span className="w-8 text-center font-bold text-sm text-slate-900">{item.jumlah}</span>
                                <button onClick={() => updateQuantity(item.barang_id, 1)} className="p-1 hover:text-orange-500"><ArrowLeft size={16} className="rotate-90 lg:rotate-180" /></button>
                            </div>
                            <button onClick={() => removeItem(item.barang_id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 mb-8">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Wallet size={18} className="text-orange-500" />
                    Pilih Metode Pembayaran
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {/* Saldo */}
                    <button
                        onClick={() => setMetode('saldo')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${metode === 'saldo' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
                    >
                        <Wallet size={20} className={metode === 'saldo' ? 'text-orange-600' : 'text-slate-400'} />
                        <span className={`text-sm font-bold ${metode === 'saldo' ? 'text-orange-700' : 'text-slate-600'}`}>Saldo</span>
                        <span className="text-[10px] text-slate-400">Rp {saldo.toLocaleString('id-ID')}</span>
                    </button>

                    {/* Hutang */}
                    <button
                        onClick={() => setMetode('hutang')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${metode === 'hutang' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
                    >
                        <CreditCard size={20} className={metode === 'hutang' ? 'text-orange-600' : 'text-slate-400'} />
                        <span className={`text-sm font-bold ${metode === 'hutang' ? 'text-orange-700' : 'text-slate-600'}`}>Hutang</span>
                        <span className="text-[10px] text-slate-400">Limit: Rp {hutangLimit.available.toLocaleString('id-ID')}</span>
                    </button>

                    {/* Cash */}
                    <button
                        onClick={() => setMetode('cash')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${metode === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
                    >
                        <CreditCard size={20} className={metode === 'cash' ? 'text-orange-600' : 'text-slate-400'} />
                        <span className={`text-sm font-bold ${metode === 'cash' ? 'text-orange-700' : 'text-slate-600'}`}>Tunai</span>
                        <span className="text-[10px] text-slate-400">Bayar di Kasir</span>
                    </button>

                    {/* Transfer */}
                    <button
                        onClick={() => setMetode('transfer')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${metode === 'transfer' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
                    >
                        <CreditCard size={20} className={metode === 'transfer' ? 'text-orange-600' : 'text-slate-400'} />
                        <span className={`text-sm font-bold ${metode === 'transfer' ? 'text-orange-700' : 'text-slate-600'}`}>Transfer</span>
                        <span className="text-[10px] text-slate-400">Bank Transfer</span>
                    </button>

                    {/* QRIS */}
                    <button
                        onClick={() => setMetode('qris')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${metode === 'qris' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
                    >
                        <CreditCard size={20} className={metode === 'qris' ? 'text-orange-600' : 'text-slate-400'} />
                        <span className={`text-sm font-bold ${metode === 'qris' ? 'text-orange-700' : 'text-slate-600'}`}>QRIS</span>
                        <span className="text-[10px] text-slate-400">Scan & Pay</span>
                    </button>
                </div>

                {/* Hutang Limit Info */}
                {metode === 'hutang' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-bold text-blue-900 mb-2">Informasi Limit Hutang</p>
                        <div className="space-y-1 text-xs text-blue-800">
                            <div className="flex justify-between">
                                <span>Limit Total:</span>
                                <span className="font-bold">Rp {hutangLimit.limit.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Hutang Saat Ini:</span>
                                <span className="font-bold">Rp {hutangLimit.current_hutang.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                                <span>Tersedia:</span>
                                <span className="font-bold text-green-600">Rp {hutangLimit.available.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Saldo Info */}
                {metode === 'saldo' && saldo < totalHarga && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs text-red-800">
                            <span className="font-bold">Saldo tidak mencukupi.</span> Saldo Anda: Rp {saldo.toLocaleString('id-ID')}
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-2xl shadow-lg text-white mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm opacity-90">Total Belanja</span>
                    <span className="text-2xl font-bold">Rp {totalHarga.toLocaleString('id-ID')}</span>
                </div>
                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full bg-white text-orange-600 py-4 rounded-xl font-bold hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                    {loading ? 'Memproses...' : 'Checkout Sekarang'}
                </button>
            </div>
        </div>
    );
}
