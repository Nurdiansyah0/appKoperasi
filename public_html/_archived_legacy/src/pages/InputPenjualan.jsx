// src/pages/kasir/InputPenjualan.jsx - UI/UX IMPROVED DENGAN PENCARIAN OTOMATIS
import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";

const normalizeProduct = (p) => ({
  id: p.barang_id ?? p.id ?? p.ID ?? p.brg_id ?? null,
  nama_item:
    p.nama_item ?? p.nama_barang ?? p.name ?? p.nama ?? p.product_name ?? "",
  harga_jual: Number(p.harga_jual ?? p.price ?? p.harga ?? 0),
  stok_item: Number(p.stok_item ?? p.stok ?? p.stock ?? 0),
  raw: p,
});

const normalizeAnggota = (a) => ({
  anggota_id: a.anggota_id ?? a.id ?? a.ID ?? null,
  user_id: a.user_id ?? null,
  nama_lengkap: a.nama_lengkap ?? a.nama ?? a.name ?? "",
  email: a.email ?? "",
  saldo: Number(a.saldo ?? 0),
  hutang: Number(a.hutang ?? 0),
  shu: Number(a.shu ?? 0),
  created_at: a.created_at ?? "",
  raw: a,
});

export default function InputPenjualan() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [allAnggota, setAllAnggota] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [displayedAnggota, setDisplayedAnggota] = useState([]);
  const [query, setQuery] = useState("");
  const [queryAnggota, setQueryAnggota] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [metode, setMetode] = useState("");
  const [memberData, setMemberData] = useState(null);
  const [manualAnggotaId, setManualAnggotaId] = useState(null);
  const [showAnggotaList, setShowAnggotaList] = useState(false);
  const [showMetodeDropdown, setShowMetodeDropdown] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const dropdownRef = useRef(null);
  const metodeDropdownRef = useRef(null);

  // Fungsi untuk memfilter produk berdasarkan query
  const filterProducts = useCallback((products, searchQuery) => {
    if (!searchQuery.trim()) {
      return products.slice(0, 3); // Tampilkan 3 produk pertama jika tidak ada query
    }

    const filtered = products.filter(
      (p) =>
        (p.nama_item || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered; // Tampilkan semua hasil yang match
  }, []);

  // Fungsi untuk memfilter anggota berdasarkan query
  const filterAnggota = useCallback((anggota, searchQuery) => {
    if (!searchQuery.trim()) {
      return []; // Sembunyikan daftar anggota jika tidak ada query
    }

    const filtered = anggota.filter(
      (a) =>
        (a.nama_lengkap || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(a.anggota_id || "").includes(searchQuery)
    );

    return filtered;
  }, []);

  // Load semua produk saat komponen mount
  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const resProduk = await api("getDataBarangBelanjaKasir", "GET");

      if (resProduk?.success && Array.isArray(resProduk.data)) {
        const normalizedProducts = resProduk.data.map(normalizeProduct);
        setAllProducts(normalizedProducts);
        setDisplayedProducts(filterProducts(normalizedProducts, query));
      } else {
        setAllProducts([]);
        setDisplayedProducts([]);
        if (resProduk?.error?.includes("Akses ditolak")) {
          setError(
            "Akses ditolak: Anda tidak memiliki izin untuk mengakses data produk"
          );
        }
      }
    } catch (err) {
      setAllProducts([]);
      setDisplayedProducts([]);
      if (
        err.message?.includes("Akses ditolak") ||
        err.message?.includes("401")
      ) {
        setError(
          "Akses ditolak: Pastikan Anda login sebagai kasir dan memiliki izin yang diperlukan"
        );
      } else if (
        err.message?.includes("Network Error") ||
        err.message?.includes("Failed to fetch")
      ) {
        setError("Koneksi terputus. Periksa koneksi internet Anda.");
      } else {
        setError(err.message || "Kesalahan saat mengambil data produk");
      }
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Load semua anggota saat komponen mount
  const loadAllAnggota = async () => {
    try {
      setLoadingAnggota(true);
      setError(null);

      const resAnggota = await api("getAllAnggota", "GET");

      if (resAnggota?.success && Array.isArray(resAnggota.data)) {
        const normalizedAnggota = resAnggota.data.map(normalizeAnggota);
        setAllAnggota(normalizedAnggota);
        setDisplayedAnggota(filterAnggota(normalizedAnggota, queryAnggota));
      } else {
        setAllAnggota([]);
        setDisplayedAnggota([]);
        if (resAnggota?.error?.includes("Akses ditolak")) {
          setError(
            "Akses ditolak: Anda tidak memiliki izin untuk mengakses data anggota"
          );
        }
      }
    } catch (err) {
      setAllAnggota([]);
      setDisplayedAnggota([]);
      if (
        err.message?.includes("Akses ditolak") ||
        err.message?.includes("401")
      ) {
        setError(
          "Akses ditolak: Pastikan Anda login sebagai kasir dan memiliki izin yang diperlukan"
        );
      } else if (
        err.message?.includes("Network Error") ||
        err.message?.includes("Failed to fetch")
      ) {
        setError("Koneksi terputus. Periksa koneksi internet Anda.");
      } else {
        setError(err.message || "Kesalahan saat mengambil data anggota");
      }
    } finally {
      setLoadingAnggota(false);
      setLastUpdate(new Date());
    }
  };

  // Effect untuk load data awal
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([loadAllProducts(), loadAllAnggota()]);
    };
    initializeData();
  }, []);

  // Effect untuk update displayed products ketika query berubah
  useEffect(() => {
    if (allProducts.length > 0) {
      const filtered = filterProducts(allProducts, query);
      setDisplayedProducts(filtered);
    }
  }, [query, allProducts, filterProducts]);

  // Effect untuk update displayed anggota ketika queryAnggota berubah
  useEffect(() => {
    if (allAnggota.length > 0) {
      const filtered = filterAnggota(allAnggota, queryAnggota);
      setDisplayedAnggota(filtered);
      setShowAnggotaList(filtered.length > 0 && queryAnggota.trim() !== "");
    }
  }, [queryAnggota, allAnggota, filterAnggota]);

  // Handler untuk menambah produk ke keranjang
  const addToCart = (product) => {
    if (product.stok_item <= 0) {
      setError(`Stok ${product.nama_item} habis`);
      return;
    }

    setError(null);
    const existing = cart.find((i) => i.id === product.id);

    if (existing) {
      if (existing.qty >= product.stok_item) {
        setError(`Stok ${product.nama_item} tidak mencukupi`);
        return;
      }
      setCart(
        cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          qty: 1,
          subtotal: product.harga_jual,
        },
      ]);
    }
  };

  // Handler untuk memilih anggota
  const selectAnggota = (anggota) => {
    setMemberData(anggota);
    setManualAnggotaId(anggota.anggota_id);
    setShowAnggotaList(false);
    setQueryAnggota(anggota.nama_lengkap); // Tampilkan nama yang dipilih di input
    setDisplayedAnggota([]);
  };

  // Handler untuk menghapus pilihan anggota
  const clearAnggota = () => {
    setMemberData(null);
    setManualAnggotaId(null);
    setQueryAnggota("");
    setDisplayedAnggota([]);
  };

  // Handler untuk mengupdate quantity
  const updateQty = (id, newQty) => {
    if (newQty < 1) {
      setCart(cart.filter((i) => i.id !== id));
      return;
    }

    const product = allProducts.find((p) => p.id === id);
    if (product && newQty > product.stok_item) {
      setError(
        `Maksimum stok ${product.nama_item} adalah ${product.stok_item}`
      );
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              qty: newQty,
              subtotal: item.harga_jual * newQty,
            }
          : item
      )
    );
    setError(null);
  };

  const removeFromCart = (id) => setCart(cart.filter((i) => i.id !== id));

  // Kalkulasi total dengan memoization
  const calculateTotal = useCallback(
    () => cart.reduce((total, item) => total + item.harga_jual * item.qty, 0),
    [cart]
  );

  // Validasi untuk metode hutang
  const canUseHutangForMember = useCallback(() => {
    if (!memberData) return false;

    const total = calculateTotal();
    const saldo = Number(memberData.saldo || 0);

    return saldo >= total;
  }, [memberData, calculateTotal]);

  const getMetodeLabel = (metode) => {
    switch (metode) {
      case "cash":
        return "Cash";
      case "qr":
        return "QR Code";
      case "ewallet":
        return "E-Wallet";
      case "transfer":
        return "Transfer Bank";
      case "hutang":
        return "Hutang";
      default:
        return "Pilih Metode";
    }
  };

  const handleMetodeSelect = (selectedMetode) => {
    setMetode(selectedMetode);
    setShowMetodeDropdown(false);
  };

  // Submit transaksi
  const submitTransaction = async () => {
    setError(null);
    setSuccessMessage("");

    // Validasi
    if (cart.length === 0) {
      setError("Keranjang kosong");
      return;
    }

    if (!metode) {
      setError("Pilih metode pembayaran");
      return;
    }

    if (metode === "hutang") {
      if (!manualAnggotaId) {
        setError("Pilih anggota untuk metode hutang");
        return;
      }
      if (!canUseHutangForMember()) {
        setError(
          `Saldo anggota tidak cukup untuk metode hutang. Saldo: ${formatCurrency(
            memberData.saldo
          )}, Dibutuhkan: ${formatCurrency(calculateTotal())}`
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const items = cart.map((item) => ({
        barang_id: item.id,
        jumlah: item.qty,
        harga_satuan: item.harga_jual,
      }));

      const payload = {
        anggota_id: manualAnggotaId ? Number(manualAnggotaId) : null,
        items: items,
        metode_pembayaran: metode,
        total: calculateTotal(),
      };

      console.log("Sending payload:", payload);

      const res = await api("buatTransaksiKasir", "POST", payload);

      if (res?.success) {
        setSuccessMessage(
          `Transaksi berhasil disimpan! ID Transaksi: ${res.transaksi_id}`
        );

        // Reset form
        setCart([]);
        setMetode("");
        setManualAnggotaId(null);
        setMemberData(null);
        setQueryAnggota("");
        setQuery("");
        setDisplayedProducts(filterProducts(allProducts, ""));
        setDisplayedAnggota([]);

        // Clear success message setelah 5 detik
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        throw new Error(
          res?.message || res?.error || "Gagal menyimpan transaksi"
        );
      }
    } catch (err) {
      if (err.message?.includes("Akses ditolak")) {
        setError("Akses ditolak: Pastikan Anda login sebagai kasir");
      } else if (err.message?.includes("saldo tidak cukup")) {
        setError("Saldo koperasi tidak cukup untuk transaksi hutang");
      } else {
        setError(err.message || "Terjadi kesalahan saat menyimpan transaksi");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Clear error dan success message
  const clearMessages = () => {
    setError(null);
    setSuccessMessage("");
  };

  // Handle click outside untuk dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        metodeDropdownRef.current &&
        !metodeDropdownRef.current.contains(event.target)
      ) {
        setShowMetodeDropdown(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAnggotaList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[26rem] h-[26rem] rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Input Penjualan — Kasir
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Halaman untuk memasukkan transaksi manual oleh kasir
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
              🔄 {formatTime(lastUpdate)}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-slate-700/60 text-gray-600 rounded-xl hover:bg-slate-600/60 transition-colors border border-gray-200 text-sm"
            >
              Kembali
            </button>
          </div>
        </div>

        {/* Messages */}
        {(error || successMessage) && (
          <div className="mb-4">
            {error && (
              <div className="bg-red-900/50 border border-red-500/30 text-red-300 px-3 py-2 sm:px-4 sm:py-3 rounded-xl backdrop-blur-lg flex justify-between items-center">
                <span className="text-sm">{error}</span>
                <button
                  onClick={clearMessages}
                  className="text-red-400 hover:text-red-200 transition-colors ml-2"
                >
                  ✕
                </button>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-900/50 border border-green-500/30 text-green-300 px-3 py-2 sm:px-4 sm:py-3 rounded-xl backdrop-blur-lg flex justify-between items-center">
                <span className="text-sm">{successMessage}</span>
                <button
                  onClick={clearMessages}
                  className="text-green-400 hover:text-green-200 transition-colors ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products Search */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Cari Produk
                </h2>
                <p className="text-indigo-200 text-xs sm:text-sm">
                  {displayedProducts.length} dari {allProducts.length} produk ditemukan {query && ` • "${query}"`}
                </p>
              </div>

              {/* Search Bar */}
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2 transition-shadow focus-within:shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Ketik untuk mencari produk (nama atau ID)..."
                    className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 text-sm w-full"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-hidden">
                <div className="min-w-0">
                  <div className="hidden sm:block">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Produk
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Harga
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Stok
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                              </div>
                              <p className="text-gray-500 mt-2 text-sm">
                                Memuat produk...
                              </p>
                            </td>
                          </tr>
                        ) : displayedProducts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              <div className="text-4xl mb-2">📦</div>
                              {query
                                ? `Tidak ada produk ditemukan untuk "${query}"`
                                : "Ketik di atas untuk mencari produk"}
                            </td>
                          </tr>
                        ) : (
                          displayedProducts.map((product) => (
                            <tr
                              key={product.id}
                              className="hover:bg-slate-700/20 transition-colors"
                            >
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.nama_item}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {product.id}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                                <div className="text-sm font-semibold text-emerald-400">
                                  {formatCurrency(product.harga_jual)}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                    product.stok_item > 10
                                      ? "bg-emerald-900/50 text-emerald-300 border-emerald-500/30"
                                      : product.stok_item > 0
                                      ? "bg-yellow-900/50 text-yellow-300 border-yellow-500/30"
                                      : "bg-red-900/50 text-red-300 border-red-500/30"
                                  }`}
                                >
                                  {product.stok_item} pcs
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={() => addToCart(product)}
                                  disabled={product.stok_item === 0}
                                  className={`px-3 py-1 sm:px-4 sm:py-2 text-sm font-medium rounded-xl transition-all ${
                                    product.stok_item === 0
                                      ? "bg-slate-600 text-gray-500 cursor-not-allowed border border-slate-500"
                                      : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 border border-indigo-500"
                                  }`}
                                >
                                  {product.stok_item === 0 ? "Habis" : "Tambah"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-2 p-3">
                    {loading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">
                          Memuat produk...
                        </p>
                      </div>
                    ) : displayedProducts.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <div className="text-4xl mb-2">📦</div>
                        {query
                          ? `Tidak ada produk ditemukan untuk "${query}"`
                          : "Ketik di atas untuk mencari produk"}
                      </div>
                    ) : (
                      displayedProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">
                                {product.nama_item}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {product.id}
                              </div>
                            </div>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                product.stok_item > 10
                                  ? "bg-emerald-900/50 text-emerald-300 border-emerald-500/30"
                                  : product.stok_item > 0
                                  ? "bg-yellow-900/50 text-yellow-300 border-yellow-500/30"
                                  : "bg-red-900/50 text-red-300 border-red-500/30"
                              }`}
                            >
                              {product.stok_item} pcs
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-semibold text-emerald-400">
                              {formatCurrency(product.harga_jual)}
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={product.stok_item === 0}
                              className={`px-3 py-1 text-sm font-medium rounded-xl transition-all ${
                                product.stok_item === 0
                                  ? "bg-slate-600 text-gray-500 cursor-not-allowed border border-slate-500"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 border border-indigo-500"
                              }`}
                            >
                              {product.stok_item === 0 ? "Habis" : "Tambah"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Info Pencarian */}
                {allProducts.length > 3 && !query && (
                  <div className="p-3 bg-slate-700/20 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Menampilkan 3 produk pertama. Ketik untuk mencari produk lainnya.
                    </p>
                  </div>
                )}
                {query && displayedProducts.length > 0 && (
                  <div className="p-3 bg-slate-700/20 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Menampilkan {displayedProducts.length} hasil pencarian untuk "{query}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Anggota Search */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Cari Anggota
                </h2>
                <p className="text-purple-200 text-xs sm:text-sm">
                  {displayedAnggota.length} anggota ditemukan{" "}
                  {queryAnggota && ` • "${queryAnggota}"`}
                </p>
              </div>

              {/* Search Bar */}
              <div className="p-3 sm:p-4 border-b border-gray-200 relative" ref={dropdownRef}>
                <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2 transition-shadow focus-within:shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Ketik untuk mencari anggota (nama, email, ID)..."
                    className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 text-sm w-full"
                    value={queryAnggota}
                    onChange={(e) => setQueryAnggota(e.target.value)}
                    onFocus={() => {
                      if (queryAnggota.trim() && displayedAnggota.length > 0) {
                        setShowAnggotaList(true);
                      }
                    }}
                  />
                </div>
              </div>
              {/* Anggota Table */}
              <div className="overflow-hidden">
                <div className="min-w-0">
                  <div className="hidden sm:block">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Anggota
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Saldo
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Hutang
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingAnggota ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                              </div>
                              <p className="text-gray-500 mt-2 text-sm">
                                Memuat anggota...
                              </p>
                            </td>
                          </tr>
                        ) : displayedAnggota.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              <div className="text-4xl mb-2">👥</div>
                              {queryAnggota
                                ? `Tidak ada anggota ditemukan untuk "${queryAnggota}"`
                                : "Ketik di atas untuk mencari anggota"}
                            </td>
                          </tr>
                        ) : (
                          displayedAnggota.map((anggota) => (
                            <tr
                              key={anggota.anggota_id}
                              className="hover:bg-slate-700/20 transition-colors"
                            >
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {anggota.nama_lengkap}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {anggota.anggota_id}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-600">
                                  {anggota.email}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                                <div className="text-sm font-semibold text-emerald-400">
                                  {formatCurrency(anggota.saldo)}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                                <div className="text-sm font-semibold text-orange-400">
                                  {formatCurrency(anggota.hutang)}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={() => selectAnggota(anggota)}
                                  className="px-3 py-1 sm:px-4 sm:py-2 text-sm font-medium rounded-xl transition-all bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 border border-emerald-500"
                                >
                                  Pilih
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-2 p-3">
                    {loadingAnggota ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">
                          Memuat anggota...
                        </p>
                      </div>
                    ) : displayedAnggota.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <div className="text-4xl mb-2">👥</div>
                        {queryAnggota
                          ? `Tidak ada anggota ditemukan untuk "${queryAnggota}"`
                          : "Ketik di atas untuk mencari anggota"}
                      </div>
                    ) : (
                      displayedAnggota.map((anggota) => (
                        <div
                          key={anggota.anggota_id}
                          className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">
                                {anggota.nama_lengkap}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {anggota.anggota_id}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {anggota.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div className="space-y-1">
                              <div className="text-xs text-emerald-400 font-medium">
                                Saldo: {formatCurrency(anggota.saldo)}
                              </div>
                              <div className="text-xs text-orange-400 font-medium">
                                Hutang: {formatCurrency(anggota.hutang)}
                              </div>
                            </div>
                            <button
                              onClick={() => selectAnggota(anggota)}
                              className="px-3 py-1 text-sm font-medium rounded-xl transition-all bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 border border-emerald-500"
                            >
                              Pilih
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl sticky top-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Keranjang
                </h2>
                <p className="text-emerald-200 text-xs sm:text-sm">
                  {cart.length} item
                </p>
              </div>

              <div className="p-3 sm:p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-slate-500 text-3xl mb-2">🛒</div>
                    <p className="text-gray-500 text-sm">
                      Keranjang belanja kosong
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-200 backdrop-blur-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate">
                            {item.nama_item}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(item.harga_jual)}/pcs
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors text-sm text-white border border-slate-500"
                          >
                            −
                          </button>
                          <span className="w-6 sm:w-8 text-center font-medium text-sm text-white">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            disabled={item.qty >= item.stok_item}
                            className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-slate-600 rounded-lg hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm text-white border border-slate-500"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors text-sm p-1"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 sm:h-4 sm:w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-600 text-sm sm:text-base">
                          Total:
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-emerald-400">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>

                      {/* Selected Anggota Display */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                          Anggota Terpilih
                        </label>
                        {memberData ? (
                          <div className="bg-blue-900/50 border border-blue-500/30 rounded-xl p-3 backdrop-blur-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-white text-sm">
                                  {memberData.nama_lengkap}
                                </div>
                                <div className="text-xs text-blue-300">
                                  {memberData.email}
                                </div>
                                <div className="text-xs mt-2 space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Saldo:
                                    </span>
                                    <span className="text-emerald-400 font-medium">
                                      {formatCurrency(memberData.saldo)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Hutang:
                                    </span>
                                    <span className="text-orange-400 font-medium">
                                      {formatCurrency(memberData.hutang)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={clearAnggota}
                                className="text-red-400 hover:text-red-300 text-sm p-1"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 text-center py-3 border border-dashed border-gray-200 rounded-xl bg-slate-800/20">
                            Belum ada anggota terpilih
                          </div>
                        )}
                      </div>

                      {/* Payment Method */}
                      <div className="mb-3 relative" ref={metodeDropdownRef}>
                        <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                          Metode Pembayaran
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowMetodeDropdown(!showMetodeDropdown)
                          }
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-900/60 text-white text-left flex justify-between items-center transition-all hover:border-slate-500"
                        >
                          <span className="text-sm">
                            {getMetodeLabel(metode)}
                          </span>
                          <span className="text-gray-500 transform transition-transform text-xs">
                            {showMetodeDropdown ? "▲" : "▼"}
                          </span>
                        </button>

                        {showMetodeDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-gray-200 rounded-xl shadow-lg backdrop-blur-lg">
                            {[
                              "cash",
                              "qr",
                              "ewallet",
                              "transfer",
                              "hutang",
                            ].map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => handleMetodeSelect(method)}
                                disabled={
                                  method === "hutang" &&
                                  (!memberData || !canUseHutangForMember())
                                }
                                className="w-full px-3 py-2 text-sm text-white text-left hover:bg-slate-700/60 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-gray-200 last:border-b-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    method === "cash"
                                      ? "bg-green-400"
                                      : method === "qr"
                                      ? "bg-purple-400"
                                      : method === "ewallet"
                                      ? "bg-blue-400"
                                      : method === "transfer"
                                      ? "bg-indigo-400"
                                      : "bg-orange-400"
                                  }`}
                                ></div>
                                {getMetodeLabel(method)}
                                {method === "hutang" &&
                                  (!memberData || !canUseHutangForMember()) && (
                                    <span className="text-xs text-gray-500 ml-auto">
                                      {!memberData
                                        ? "(pilih anggota)"
                                        : "(saldo tidak cukup)"}
                                    </span>
                                  )}
                              </button>
                            ))}
                          </div>
                        )}

                        {metode === "hutang" &&
                          memberData &&
                          !canUseHutangForMember() && (
                            <div className="text-red-400 text-xs mt-1 bg-red-900/50 p-2 rounded-xl border border-red-500/30 flex items-center gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Saldo tidak cukup:{" "}
                              {formatCurrency(memberData.saldo)}
                            </div>
                          )}
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={submitTransaction}
                        disabled={
                          submitting ||
                          cart.length === 0 ||
                          !metode ||
                          (metode === "hutang" &&
                            (!memberData || !canUseHutangForMember()))
                        }
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2 sm:py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 text-sm sm:text-base border border-emerald-500"
                      >
                        {submitting ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            Simpan Transaksi
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
