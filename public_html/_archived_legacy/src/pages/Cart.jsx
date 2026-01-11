import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import NavbarMarketplace from '../components/NavbarMarketplace';
import Swal from 'sweetalert2';
import { api } from '../utils/api';

export default function Cart({ user }) {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
    const [checkoutStep, setCheckoutStep] = useState(0); // 0: Cart, 1: Payment/Address
    // Backend accepts: cash, qr, ewallet, transfer, hutang
    const [paymentMethod, setPaymentMethod] = useState('ewallet');
    const [loading, setLoading] = useState(false);
    const [editingAddress, setEditingAddress] = useState(false);
    const [memberData, setMemberData] = useState(null);

    // Address (Mock)
    const [address, setAddress] = useState("Jl. Anggrek No. 12, Batam Center");

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setCheckoutStep(1);
    };

    // Fetch member financial data
    useEffect(() => {
        const fetchMemberData = async () => {
            try {
                const res = await api("getProfil", "GET");
                if (res && res.success) {
                    setMemberData(res.data || res.user || res.anggota);
                }
            } catch (err) {
                console.error("Failed to fetch member data", err);
            }
        };
        fetchMemberData();
    }, []);

    const submitOrder = async () => {
        setLoading(true);
        try {
            // Prepare payload
            // Backend expects: { items: [], metode_pembayaran: '' }
            // items: [{ barang_id, jumlah, harga_satuan }]
            const payload = {
                items: cart.map(item => ({
                    barang_id: item.id,
                    jumlah: item.quantity,
                    harga_satuan: item.harga_jual
                })),
                metode_pembayaran: paymentMethod
            };

            const res = await api("simpanTransaksi", "POST", payload);

            if (res && res.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Pesanan Berhasil!',
                    text: 'Terima kasih telah berbelanja. Menunggu konfirmasi kasir.',
                }).then(() => {
                    clearCart();
                    navigate('/riwayat'); // Or /orders if exists, or back to /belanja
                });
            } else {
                throw new Error(res?.message || "Gagal memproses pesanan");
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0 && checkoutStep === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavbarMarketplace user={user} />
                <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
                    <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Keranjang Belanja Kosong</h2>
                    <p className="text-gray-500 mb-6">Yuk isi keranjangmu dengan produk pilihan Koperasi!</p>
                    <button
                        onClick={() => navigate('/belanja')}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Mulai Belanja
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <NavbarMarketplace user={user} />

            <div className="container mx-auto max-w-5xl px-4 py-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    {checkoutStep === 1 && (
                        <button onClick={() => setCheckoutStep(0)} className="text-gray-500 hover:text-orange-500 mr-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    {checkoutStep === 0 ? "Keranjang Belanja" : "Pengiriman & Pembayaran"}
                </h1>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                        {checkoutStep === 0 ? (
                            // Cart Items
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                                            <img
                                                src={`https://placehold.co/150x150/orange/white?text=${encodeURIComponent(item.nama_item.substring(0, 2))}`}
                                                alt={item.nama_item}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 line-clamp-2">{item.nama_item}</h3>
                                            <div className="text-orange-600 font-bold">Rp {item.harga_jual.toLocaleString('id-ID')}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center border rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className={`px-2 py-1 ${item.quantity <= 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                                    disabled={item.quantity <= 1}
                                                >-</button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                                >+</button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-red-500 text-xs hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Checkout Form
                            <div className="space-y-6">
                                {/* Address Section */}
                                <div className="bg-white p-6 rounded-xl shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Alamat Pengiriman
                                    </h3>
                                    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                                        <p className="font-medium text-gray-800">{user.nama_user}</p>
                                        {editingAddress ? (
                                            <div className="mt-2 space-y-2">
                                                <textarea
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                                                    rows="3"
                                                    placeholder="Masukkan alamat lengkap..."
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingAddress(false)}
                                                        className="px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                                                    >
                                                        Simpan
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setAddress("Jl. Anggrek No. 12, Batam Center");
                                                            setEditingAddress(false);
                                                        }}
                                                        className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-gray-600 text-sm mt-1">{address}</p>
                                                <button
                                                    onClick={() => setEditingAddress(true)}
                                                    className="text-orange-500 text-sm font-medium mt-2 hover:underline"
                                                >
                                                    Ubah Alamat
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="bg-white p-6 rounded-xl shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                        Metode Pembayaran
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'ewallet', label: `Saldo Anggota (Rp ${Number(memberData?.saldo || 0).toLocaleString('id-ID')})` },
                                            { value: 'cash', label: 'Tunai (Cash)' },
                                            { value: 'transfer', label: 'Transfer Bank' }
                                        ].map((option) => (
                                            <label key={option.value} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === option.value ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'hover:border-gray-300'}`}>
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value={option.value}
                                                    checked={paymentMethod === option.value}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="text-orange-600 focus:ring-orange-500"
                                                />
                                                <span className="ml-3 capitalize font-medium text-gray-700">
                                                    {option.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:w-80">
                        <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24">
                            <h3 className="font-bold text-gray-800 mb-4">Ringkasan Belanja</h3>

                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>Total Harga ({cart.length} barang)</span>
                                    <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="border-t pt-4 mb-6">
                                <div className="flex justify-between font-bold text-lg text-gray-800">
                                    <span>Total Tagihan</span>
                                    <span className="text-orange-600">Rp {cartTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <button
                                onClick={checkoutStep === 0 ? handleCheckout : submitOrder}
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200'
                                    }`}
                            >
                                {loading ? 'Memproses...' : (checkoutStep === 0 ? 'Checkout' : 'Buat Pesanan')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
