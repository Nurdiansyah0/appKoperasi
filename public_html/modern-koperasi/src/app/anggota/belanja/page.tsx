'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/utils/api';
import { ShoppingCart, Search, Filter, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

export default function BelanjaPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<any[]>([]);

    useEffect(() => {
        fetchItems();
        loadCart();
    }, []);

    const fetchItems = async () => {
        try {
            const res: any = await api.get('/anggota/items'); // Endpoint specific for members
            if (res.success) {
                setItems(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCart = () => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) setCart(JSON.parse(savedCart));
    };

    const addToCart = (item: any) => {
        const existingIndex = cart.findIndex(c => c.barang_id === item.barang_id);
        let newCart = [...cart];

        if (existingIndex >= 0) {
            newCart[existingIndex].jumlah += 1;
        } else {
            newCart.push({ ...item, jumlah: 1 });
        }

        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));

        Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Barang ditambahkan ke keranjang',
            timer: 800,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    const filteredItems = items.filter(item =>
        item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Memuat katalog barang...</div>;

    return (
        <div className="pb-24 overflow-auto min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Katalog Belanja</h1>
                    <p className="text-slate-500 text-sm">Temukan barang kebutuhan Anda di sini.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Cari nama barang..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                {filteredItems.map((item) => (
                    <motion.div
                        key={item.barang_id}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
                    >
                        <div className="aspect-square bg-slate-100 flex items-center justify-center p-4">
                            {/* Placeholder for image */}
                            <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                <ShoppingCart size={24} />
                            </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="font-bold text-slate-800 text-sm mb-1 truncate">{item.nama_barang}</h3>
                            <p className="text-xs text-slate-500 mb-3">Stok: {item.stok}</p>

                            <div className="mt-auto flex items-center justify-between gap-2">
                                <p className="font-bold text-orange-500 text-xs truncate">Rp {Number(item.harga_jual).toLocaleString('id-ID')}</p>
                                <button
                                    onClick={() => addToCart(item)}
                                    className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Floating Cart Button for Mobile */}
            {cart.length > 0 && (
                <Link
                    href="/anggota/cart"
                    className="fixed bottom-24 right-6 bg-orange-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce"
                >
                    <ShoppingCart size={24} />
                    <span className="font-bold">{cart.reduce((acc, curr) => acc + curr.jumlah, 0)}</span>
                </Link>
            )}
        </div>
    );
}
