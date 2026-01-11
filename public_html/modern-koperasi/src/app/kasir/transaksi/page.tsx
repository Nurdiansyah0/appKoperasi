'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface Barang {
    barang_id: number;
    nama_barang: string;
    harga_jual: number;
    stok: number;
}

interface Anggota {
    anggota_id: number;
    username: string;
    nama_lengkap?: string;
    saldo: number;
}

interface CartItem extends Barang {
    quantity: number;
}

export default function TransaksiPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Barang[]>([]);
    const [filteredItems, setFilteredItems] = useState<Barang[]>([]);
    const [members, setMembers] = useState<Anggota[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedMember, setSelectedMember] = useState<number | ''>('');
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, transfer, hutang
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
                await Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak',
                    text: 'Anda tidak memiliki hak akses.',
                    confirmButtonColor: '#f97316'
                });
                router.push('/login');
                return;
            }

            setUser(parsedUser);
            await Promise.all([fetchItems(token), fetchMembers(token)]);
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const fetchItems = async (token: string) => {
        try {
            const response = await fetch('/api/kasir/items', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setItems(result.data);
                setFilteredItems(result.data);
            }
        } catch (error) {
            console.error('Error items:', error);
        }
    };

    const fetchMembers = async (token: string) => {
        try {
            const response = await fetch('/api/kasir/anggota', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setMembers(result.data);
            }
        } catch (error) {
            console.error('Error members:', error);
        }
    };

    useEffect(() => {
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            setFilteredItems(items.filter(i => i.nama_barang.toLowerCase().includes(lower)));
        } else {
            setFilteredItems(items);
        }
    }, [searchQuery, items]);

    const addToCart = (item: Barang) => {
        setCart(prev => {
            const existing = prev.find(i => i.barang_id === item.barang_id);
            if (existing) {
                return prev.map(i => i.barang_id === item.barang_id
                    ? { ...i, quantity: Math.min(i.quantity + 1, i.stok) }
                    : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(i => i.barang_id !== id));
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.barang_id === id) {
                const newQty = i.quantity + delta;
                if (newQty <= 0) return i;
                if (newQty > i.stok) return i;
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.harga_jual * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!selectedMember) {
            Swal.fire({
                icon: 'warning',
                title: 'Pilih Anggota',
                text: 'Mohon pilih anggota untuk melanjutkan transaksi!',
                confirmButtonColor: '#f97316'
            });
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const confirmResult = await Swal.fire({
            title: 'Konfirmasi Transaksi',
            text: `Proses transaksi senilai Rp ${totalAmount.toLocaleString('id-ID')}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Proses!',
            cancelButtonText: 'Batal'
        });

        if (!confirmResult.isConfirmed) return;

        try {
            const response = await fetch('/api/kasir/transaksi/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    anggota_id: selectedMember || null,
                    items: cart.map(i => ({ barang_id: i.barang_id, quantity: i.quantity })),
                    payment_method: paymentMethod,
                    total_amount: totalAmount // send total for validation/logging
                })
            });

            const result = await response.json();
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Transaksi Berhasil!',
                    timer: 1500,
                    showConfirmButton: false
                });
                setCart([]);
                setSelectedMember('');
                fetchItems(token); // Refresh stock
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: result.error || 'Transaksi Gagal',
                    confirmButtonColor: '#f97316'
                });
            }
        } catch (error) {
            console.error('Checkout error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Gagal memproses transaksi',
                confirmButtonColor: '#f97316'
            });
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50">Loading...</div>;

    return (
        <div className="flex h-full bg-gray-100 overflow-hidden">
            {/* Left Side - Product List */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white shadow z-10 p-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Kasir Point of Sale</h1>
                    <div className="flex gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Cari barang..."
                            className="px-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredItems.map(item => (
                            <div key={item.barang_id}
                                onClick={() => addToCart(item)}
                                className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition active:scale-95 select-none ${item.stok === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <div className="h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-medium text-gray-900 truncate" title={item.nama_barang}>{item.nama_barang}</h3>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="text-orange-600 font-bold">Rp {item.harga_jual.toLocaleString('id-ID')}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${item.stok <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        Stok: {item.stok}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Right Side - Cart */}
            <div className="w-96 bg-white shadow-xl flex flex-col border-l border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Keranjang Belanja
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p>Keranjang kosong</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.barang_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm truncate">{item.nama_barang}</p>
                                    <p className="text-xs text-orange-600">Rp {item.harga_jual.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.barang_id, -1)} className="w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">-</button>
                                    <span className="text-sm font-medium w-6 text-center text-gray-600">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.barang_id, 1)} className="w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">+</button>
                                </div>
                                <button onClick={() => removeFromCart(item.barang_id)} className="ml-2 text-red-500 hover:text-red-700">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                    {/* Member Selection */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pelanggan</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 pr-8 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                placeholder="Cari nama anggota..."
                                value={memberSearchQuery}
                                onChange={(e) => {
                                    setMemberSearchQuery(e.target.value);
                                    setShowMemberDropdown(true);
                                    if (selectedMember) setSelectedMember('');
                                }}
                                onFocus={() => setShowMemberDropdown(true)}
                                onBlur={() => setTimeout(() => setShowMemberDropdown(false), 200)}
                            />
                            {selectedMember && (
                                <button
                                    onClick={() => {
                                        setSelectedMember('');
                                        setMemberSearchQuery('');
                                    }}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {showMemberDropdown && memberSearchQuery && !selectedMember && (
                            <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                {members.filter(m =>
                                    m.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                    (m.nama_lengkap && m.nama_lengkap.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                                ).map(m => (
                                    <div
                                        key={m.anggota_id}
                                        onClick={() => {
                                            setSelectedMember(m.anggota_id);
                                            setMemberSearchQuery(m.username + (m.nama_lengkap ? ` (${m.nama_lengkap})` : ''));
                                            setShowMemberDropdown(false);
                                        }}
                                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900 border-b border-gray-50 last:border-0"
                                    >
                                        <div className="font-medium">{m.username}</div>
                                        <div className="text-xs text-gray-500">
                                            {m.nama_lengkap ? `${m.nama_lengkap} • ` : ''}
                                            Saldo: Rp {m.saldo.toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                ))}
                                {members.filter(m =>
                                    m.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                    (m.nama_lengkap && m.nama_lengkap.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                                ).length === 0 && (
                                        <div className="p-2 text-sm text-gray-500 text-center">Tidak ada hasil</div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pembayaran</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="cash">Tunai (Cash)</option>
                            <option value="transfer">Transfer Bank</option>
                            <option value="ewallet">E-Wallet</option>
                            <option value="qr">QRIS</option>
                            {selectedMember && <option value="hutang">Hutang (Saldo Anggota)</option>}
                        </select>
                    </div>

                    {/* Totals */}
                    <div className="pt-2">
                        <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                            <span>Total</span>
                            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow transition transform active:scale-95 ${cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                            }`}
                    >
                        Proses Pembayaran
                    </button>
                </div>
            </div>
        </div>
    );
}
