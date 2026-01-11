import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import NavbarMarketplace from "../components/NavbarMarketplace";
import { useCart } from "../context/CartContext";
import Swal from "sweetalert2";

export default function ProductDetail({ user }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api("getDataBarangBelanja", "GET");
                if (res?.data) {
                    const found = res.data.find(
                        (p) => String(p.barang_id || p.id) === String(id)
                    );
                    if (found) setProduct(found);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!product) return <div className="p-10 text-center">Produk tidak ditemukan</div>;

    const handleAddToCart = () => {
        addToCart({
            id: product.barang_id || product.id,
            nama_item: product.nama_barang || product.nama_item,
            harga_jual: parseInt(product.harga_jual),
            stok: product.stok
        }, qty);

        Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Produk ditambahkan ke keranjang',
            showConfirmButton: false,
            timer: 1500,
            toast: true,
            position: 'top-end'
        });
    };

    const handleBuy = () => {
        handleAddToCart();
        navigate('/cart');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <NavbarMarketplace user={user} />

            <div className="container mx-auto max-w-4xl p-4">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 text-gray-500 hover:text-orange-500 flex items-center gap-1"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali
                </button>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="w-full md:w-1/2 aspect-square bg-gray-200 flex items-center justify-center relative">
                        <img
                            src={`https://placehold.co/600x600/orange/white?text=${encodeURIComponent(product.nama_barang)}`}
                            alt={product.nama_barang}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="p-6 md:w-1/2 flex flex-col">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.nama_barang}</h1>

                        <div className="text-3xl font-bold text-orange-600 mb-4">
                            Rp {parseInt(product.harga_jual).toLocaleString('id-ID')}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                            <div className="px-3 py-1 bg-gray-100 rounded-full">
                                Stok: <span className="font-semibold text-gray-900">{product.stok}</span>
                            </div>
                            <div>
                                Terjual: <span className="font-semibold text-gray-900">0</span>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Deskripsi produk ini belum tersedia. Namun produk ini dijamin kualitasnya oleh Koperasi PK Batam.
                        </p>

                        <div className="mt-auto border-t pt-6">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-gray-600">Jumlah:</span>
                                <div className="flex items-center border rounded-lg">
                                    <button
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="px-3 py-1 hover:bg-gray-100"
                                    >-</button>
                                    <input
                                        type="text"
                                        value={qty}
                                        readOnly
                                        className="w-12 text-center text-gray-800 font-medium border-l border-r py-1"
                                    />
                                    <button
                                        onClick={() => setQty(Math.min(product.stok, qty + 1))}
                                        className="px-3 py-1 hover:bg-gray-100"
                                    >+</button>
                                </div>
                                <span className="text-xs text-gray-500">{product.stok} tersisa</span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 px-6 py-3 border border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Keranjang
                                </button>
                                <button
                                    onClick={handleBuy}
                                    className="flex-1 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Beli Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
