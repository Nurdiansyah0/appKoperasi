import React, { useEffect, useState, useRef } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";
import NavbarMarketplace from "../components/NavbarMarketplace";
import { motion } from "framer-motion";

const normalizeProduct = (p) => ({
  id: p.barang_id ?? p.id ?? p.ID ?? p.brg_id ?? null,
  nama_item:
    p.nama_item ?? p.nama_barang ?? p.name ?? p.nama ?? p.product_name ?? "",
  harga_jual: Number(p.harga_jual ?? p.price ?? p.harga ?? 0),
  stok_item: Number(p.stok_item ?? p.stok ?? p.stock ?? 0),
  raw: p,
});

export default function Belanja({ user }) {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberData, setMemberData] = useState(null);

  // Banners
  const banners = [
    "https://placehold.co/1200x400/orange/white?text=Promo+Spesial+Anggota",
    "https://placehold.co/1200x400/2563eb/white?text=Kebutuhan+Pokok+Murah",
    "https://placehold.co/1200x400/16a34a/white?text=Produk+Terbaru"
  ];
  const [activeBanner, setActiveBanner] = useState(0);

  // Categories (Mock)
  const categories = [
    { id: 1, name: "Sembako", icon: "🍚" },
    { id: 2, name: "Minuman", icon: "🥤" },
    { id: 3, name: "Snack", icon: "🍪" },
    { id: 4, name: "Obat", icon: "💊" },
    { id: 5, name: "ATK", icon: "✏️" },
    { id: 6, name: "Lainnya", icon: "📦" },
  ];

  useEffect(() => {
    fetchProducts();
    fetchMemberData();
    // Banner Interval
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (allProducts.length > 0) {
      const filtered = allProducts.filter(
        (product) =>
          product.nama_item.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDisplayedProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api("getDataBarangBelanja", "GET");
      if (res?.success && Array.isArray(res.data)) {
        const normalized = res.data.map(normalizeProduct);
        setAllProducts(normalized);
        setDisplayedProducts(normalized);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarMarketplace
        cartCount={0}
        user={user}
        onSearch={setSearchQuery}
      />

      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-8">

        {/* Wallet Info Card */}
        {memberData && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-orange-50 p-2 sm:p-3 rounded-xl text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Saldo Saya</p>
                <p className="text-sm sm:text-lg font-bold text-gray-800">
                  Rp {Number(memberData.saldo || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 border-l border-gray-100 pl-4">
              <div className="bg-emerald-50 p-2 sm:p-3 rounded-xl text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Estimasi SHU</p>
                <p className="text-sm sm:text-lg font-bold text-gray-800">
                  Rp {Number(memberData.shu || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Banner Section */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-40 md:h-[300px]">
          {banners.map((src, idx) => (
            <motion.div
              key={idx}
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: activeBanner === idx ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <img src={src} alt="Banner" className="w-full h-full object-cover" />
            </motion.div>
          ))}

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBanner(idx)}
                className={`w-2 h-2 rounded-full transition-all ${activeBanner === idx ? 'bg-white w-6' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 cursor-pointer hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">{cat.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 border-l-4 border-orange-500 pl-3">Rekomendasi</h2>
            <button className="text-orange-500 text-sm font-medium hover:underline">Lihat Semua</button>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading products...</div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Tidak ada produk ditemukan</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {displayedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full"
                  onClick={() => handleProductClick(product.id)}
                >
                  {/* Image Placeholder */}
                  <div className="aspect-square bg-gray-200 relative">
                    <img
                      src={`https://placehold.co/300x300/orange/white?text=${encodeURIComponent(product.nama_item.substring(0, 2))}`}
                      alt={product.nama_item}
                      className="w-full h-full object-cover"
                    />
                    {product.stok_item === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold px-3 py-1 bg-red-600 rounded-full text-xs">HABIS</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="line-clamp-2 text-sm text-gray-800 mb-1 h-10">{product.nama_item}</h3>
                    <div className="mt-auto">
                      <div className="font-bold text-orange-600 text-base">
                        Rp {product.harga_jual.toLocaleString('id-ID')}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                        <span>Stok: {product.stok_item}</span>
                        <span>0 Terjual</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
