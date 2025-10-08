// src/pages/Belanja.jsx - UI/UX IMPROVED
import React, { useEffect, useState, useRef } from "react";
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

export default function Belanja() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anggotaId, setAnggotaId] = useState(null);
  const [metode, setMetode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [saldoAnggota, setSaldoAnggota] = useState(0);
  const [profilData, setProfilData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showMetodeDropdown, setShowMetodeDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const getTokenFromStorage = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return token;
  };

  const fetchUserData = async () => {
    try {
      const token = getTokenFromStorage();
      if (!token) {
        throw new Error("Token tidak ditemukan, silakan login kembali.");
      }

      const userRes = await api("autoLogin", "GET");

      if (!userRes?.success || !userRes.user) {
        throw new Error(userRes?.error || "Auto-login gagal");
      }

      return userRes.user;
    } catch (err) {
      console.error("Error in fetchUserData:", err);
      throw err;
    }
  };

  const fetchProfilData = async () => {
    try {
      const response = await api("getProfil", "GET");

      if (response?.success) {
        if (response.user) {
          return response.user;
        } else if (response.data) {
          return response.data;
        } else {
          throw new Error("Struktur data profil tidak valid");
        }
      } else {
        const errorMsg = response?.error || "Gagal mengambil profil";

        if (errorMsg.includes("Akses ditolak") || errorMsg.includes("denied")) {
          throw new Error(
            "Akses ditolak. Pastikan Anda memiliki izin untuk mengakses data profil."
          );
        } else if (
          errorMsg.includes("tidak ditemukan") ||
          errorMsg.includes("not found")
        ) {
          throw new Error("Data profil tidak ditemukan untuk user ini.");
        } else {
          throw new Error(errorMsg);
        }
      }
    } catch (error) {
      console.error("Error fetch profil:", error);
      throw error;
    }
  };

  const fetchProducts = async () => {
    try {
      const productsRes = await api("getDataBarangBelanja", "GET");

      if (productsRes?.success && Array.isArray(productsRes.data)) {
        return productsRes.data.map(normalizeProduct);
      } else {
        throw new Error("Gagal memuat data produk");
      }
    } catch (err) {
      console.error("Error fetch products:", err);
      throw err;
    }
  };

  // Fungsi untuk memfilter produk berdasarkan search query - DIPERBAIKI
  const filterProducts = (products, query) => {
    if (!query.trim()) {
      // Jika tidak ada query, tampilkan 3 produk pertama
      return products.slice(0, 3);
    }

    // Jika ada query, tampilkan SEMUA hasil yang sesuai tanpa batasan
    const filtered = products.filter(
      (product) =>
        product.nama_item.toLowerCase().includes(query.toLowerCase()) ||
        String(product.id).includes(query)
    );

    return filtered; // Hapus .slice(0, 3) agar menampilkan semua hasil pencarian
  };

  // Fungsi refreshData yang sudah diperbaiki
  const refreshData = async (silent = true) => {
    try {
      const [products, profil] = await Promise.all([
        fetchProducts(),
        fetchProfilData(),
      ]);

      setAllProducts(products);

      const currentSearchQuery = searchQueryRef.current;
      const filteredProducts = filterProducts(products, currentSearchQuery);
      setDisplayedProducts(filteredProducts);

      if (profil) {
        setProfilData(profil);
        const finalAnggotaId = profil.anggota_id ?? profil.anggotaId ?? null;
        setAnggotaId(finalAnggotaId != null ? Number(finalAnggotaId) : null);

        const saldo = parseFloat(profil.saldo ?? profil.saldo_anggota ?? 0);
        setSaldoAnggota(saldo);
      }

      setLastUpdate(new Date());
    } catch (err) {
      if (!silent) {
        console.error("Error in refreshData:", err);
        setError(err.message || "Gagal memuat data terbaru");
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    let refreshInterval;

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [user, products, profil] = await Promise.all([
          fetchUserData(),
          fetchProducts(),
          fetchProfilData(),
        ]);

        if (!isMounted) return;

        setAllProducts(products);
        // Set displayed products berdasarkan search query (kosong di awal)
        setDisplayedProducts(filterProducts(products, searchQuery));

        if (profil) {
          setProfilData(profil);
          const finalAnggotaId = profil.anggota_id ?? profil.anggotaId ?? null;
          setAnggotaId(finalAnggotaId != null ? Number(finalAnggotaId) : null);

          const saldo = parseFloat(profil.saldo ?? profil.saldo_anggota ?? 0);
          setSaldoAnggota(saldo);
        }

        refreshInterval = setInterval(() => {
          if (isMounted) {
            refreshData(true);
          }
        }, 15000);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error in initializeData:", err);
        setError(err.message || "Gagal memuat data");
      } finally {
        if (!isMounted) return;
        setLoading(false);
        setLastUpdate(new Date());
      }
    };

    initializeData();

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMetodeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Effect untuk menangani perubahan search query
  useEffect(() => {
    if (allProducts.length > 0) {
      const filtered = filterProducts(allProducts, searchQuery);
      setDisplayedProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  const safeProfilData = profilData || {
    saldo: 0,
    hutang: 0,
    shu: 0,
    nama_lengkap: "Anggota",
  };

  const addToCart = (product) => {
    if (product.stok_item <= 0) {
      setError(`Stok ${product.nama_item} habis`);
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.qty >= product.stok_item) {
        setError(`Stok ${product.nama_item} tidak mencukupi`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }

    setError(null);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) {
      removeFromCart(id);
      return;
    }

    const product = allProducts.find((p) => p.id === id);
    if (product && newQty > product.stok_item) {
      setError(`Stok tidak mencukupi. Maksimal: ${product.stok_item}`);
      return;
    }

    setCart(
      cart.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
    );
    setError(null);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.harga_jual * item.qty, 0);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const canUseHutang = () => {
    const total = calculateTotal();
    return saldoAnggota >= total;
  };

  const handleMetodeSelect = (selectedMetode) => {
    setMetode(selectedMetode);
    setShowMetodeDropdown(false);
  };

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

  const showConfirmation = () => {
    if (cart.length === 0) {
      setError("Keranjang belanja kosong");
      return;
    }

    if (!anggotaId) {
      setError("Data anggota tidak tersedia. Silakan login ulang.");
      return;
    }

    if (!metode) {
      setError("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    if (metode === "hutang" && !canUseHutang()) {
      const total = calculateTotal();
      setError(
        `Saldo tidak cukup untuk hutang. Saldo Anda: ${formatCurrency(
          saldoAnggota
        )}, Dibutuhkan: ${formatCurrency(total)}`
      );
      return;
    }

    setShowConfirm(true);
  };

  const submitOrder = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const items = cart.map((item) => ({
        barang_id: item.id,
        jumlah: item.qty,
        harga_satuan: item.harga_jual,
      }));

      const payload = {
        items,
        metode_pembayaran: metode,
      };

      const res = await api("simpanTransaksi", "POST", payload);

      if (res?.success) {
        setSuccessMessage(
          "Pesanan berhasil dikirim ke kasir! Menunggu proses selanjutnya."
        );
        setCart([]);
        setMetode("");
        setShowConfirm(false);

        setTimeout(() => {
          refreshData();
        }, 2000);
      } else {
        throw new Error(
          res?.error || res?.message || "Gagal menyimpan transaksi"
        );
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengirim pesanan");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage("");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error && !allProducts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="relative z-10 text-center max-w-md p-6 bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-300 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a] py-4 px-3 sm:px-4">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[26rem] h-[26rem] rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Belanja
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Temukan dan beli produk koperasi dengan mudah
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-300">
              Halo,{" "}
              <span className="font-medium text-white">
                {safeProfilData.nama_lengkap}
              </span>
            </div>
            <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
              🔄 {formatTime(lastUpdate)}
            </div>
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

        {/* Info Saldo Anggota */}
        {profilData && (
          <div className="bg-gradient-to-tr from-blue-900/50 to-blue-800/40 backdrop-blur-lg border border-blue-500/30 text-blue-200 px-3 py-2 sm:px-4 sm:py-3 rounded-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <div className="p-1 sm:p-2 bg-blue-500/20 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-white">
                    {safeProfilData.nama_lengkap}
                  </span>
                  <span className="mx-1 sm:mx-2 text-blue-400">•</span>
                  <span>
                    Saldo:{" "}
                    <strong className="text-white">
                      {formatCurrency(saldoAnggota)}
                    </strong>
                  </span>
                </div>
              </div>
              {metode === "hutang" && (
                <span
                  className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${
                    canUseHutang() ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {canUseHutang() ? (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Dapat menggunakan hutang
                    </>
                  ) : (
                    <>
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Saldo tidak cukup
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
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
                  Daftar Produk
                </h2>
                <p className="text-indigo-200 text-xs sm:text-sm">
                  {displayedProducts.length} dari {allProducts.length} produk
                  {searchQuery && ` • "${searchQuery}"`}
                </p>
              </div>

              {/* Search Bar */}
              <div className="p-3 sm:p-4 border-b border-slate-600/40">
                <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2 transition-shadow focus-within:shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400"
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
                    placeholder="Cari produk..."
                    className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 text-sm w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-hidden">
                <div className="min-w-0">
                  <div className="hidden sm:block">
                    <table className="w-full">
                      <thead className="bg-slate-700/40">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Produk
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Harga
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Stok
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600/40">
                        {displayedProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">
                                {product.nama_item}
                              </div>
                              <div className="text-xs text-slate-400">
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
                                    ? "bg-slate-600 text-slate-400 cursor-not-allowed border border-slate-500"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 border border-indigo-500"
                                }`}
                              >
                                {product.stok_item === 0 ? "Habis" : "Tambah"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-2 p-3">
                    {displayedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/40"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm">
                              {product.nama_item}
                            </div>
                            <div className="text-xs text-slate-400">
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
                                ? "bg-slate-600 text-slate-400 cursor-not-allowed border border-slate-500"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 border border-indigo-500"
                            }`}
                          >
                            {product.stok_item === 0 ? "Habis" : "Tambah"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {displayedProducts.length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-400">
                      <div className="text-4xl mb-2">📦</div>
                      {searchQuery
                        ? `Tidak ada produk ditemukan untuk "${searchQuery}"`
                        : "Tidak ada produk yang tersedia"}
                    </div>
                  )}
                </div>

                {/* Info Pencarian */}
                {allProducts.length > 3 && !searchQuery && (
                  <div className="p-3 bg-slate-700/20 border-t border-slate-600/40">
                    <p className="text-xs text-slate-400 text-center">
                      Menampilkan 3 produk pertama. Gunakan pencarian untuk
                      produk lainnya.
                    </p>
                  </div>
                )}
                {searchQuery && displayedProducts.length > 0 && (
                  <div className="p-3 bg-slate-700/20 border-t border-slate-600/40">
                    <p className="text-xs text-slate-400 text-center">
                      Menampilkan {displayedProducts.length} hasil pencarian
                      untuk "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Section - DITAMBAHKAN KEMBALI */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl sticky top-4">
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
                  {totalItems} item
                </p>
              </div>

              <div className="p-3 sm:p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-slate-500 text-3xl mb-2">🛒</div>
                    <p className="text-slate-400 text-sm">
                      Keranjang belanja kosong
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 sm:p-3 bg-slate-700/40 rounded-xl border border-slate-600/40 backdrop-blur-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate">
                            {item.nama_item}
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatCurrency(item.harga_jual)}/pcs
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.qty - 1)
                            }
                            className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors text-sm text-white border border-slate-500"
                          >
                            −
                          </button>
                          <span className="w-6 sm:w-8 text-center font-medium text-sm text-white">
                            {item.qty}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.qty + 1)
                            }
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
                    <div className="border-t border-slate-600/40 pt-3 mt-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-slate-300 text-sm sm:text-base">
                          Total:
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-emerald-400">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>

                      {/* Payment Method */}
                      <div className="mb-3 relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                          Metode Pembayaran
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowMetodeDropdown(!showMetodeDropdown)
                          }
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-600/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-900/60 text-white text-left flex justify-between items-center transition-all hover:border-slate-500"
                        >
                          <span className="text-sm">
                            {getMetodeLabel(metode)}
                          </span>
                          <span className="text-slate-400 transform transition-transform text-xs">
                            {showMetodeDropdown ? "▲" : "▼"}
                          </span>
                        </button>

                        {showMetodeDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600/40 rounded-xl shadow-lg backdrop-blur-lg">
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
                                className="w-full px-3 py-2 text-sm text-white text-left hover:bg-slate-700/60 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-slate-600/40 last:border-b-0 flex items-center gap-2"
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
                              </button>
                            ))}
                          </div>
                        )}

                        {metode === "hutang" && !canUseHutang() && (
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
                            Saldo tidak cukup: {formatCurrency(saldoAnggota)}
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={showConfirmation}
                        disabled={
                          !metode || (metode === "hutang" && !canUseHutang())
                        }
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2 sm:py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 text-sm sm:text-base border border-emerald-500"
                      >
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
                        Kirim ke Kasir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-gradient-to-tr from-slate-800/80 to-slate-900/90 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl max-w-md w-full mx-2">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-yellow-900/50 rounded-full mb-3 sm:mb-4 border border-yellow-500/30">
                  <span className="text-xl sm:text-2xl text-yellow-400">
                    ⚠️
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white text-center mb-2">
                  Konfirmasi Pesanan
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 text-center mb-3 sm:mb-4">
                  Barang yang sudah dipesan tidak dapat di cancel. Harap periksa
                  barang pesanan Anda.
                </p>

                <div className="bg-slate-700/40 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-slate-600/40 backdrop-blur-sm">
                  <div className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1 sm:gap-2">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Detail Pesanan:
                  </div>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-xs sm:text-sm text-slate-400 mb-1"
                    >
                      <span className="truncate flex-1 mr-2">
                        {item.nama_item} × {item.qty}
                      </span>
                      <span className="flex-shrink-0">
                        {formatCurrency(item.harga_jual * item.qty)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-600/40 mt-2 pt-2 flex justify-between font-semibold text-white text-sm sm:text-base">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-slate-400 mt-1">
                    <span>Metode:</span>
                    <span className="capitalize text-slate-300">
                      {getMetodeLabel(metode)}
                    </span>
                  </div>
                  {metode === "hutang" && (
                    <div className="flex justify-between text-xs sm:text-sm text-emerald-400 mt-1">
                      <span>Saldo setelah:</span>
                      <span>
                        {formatCurrency(saldoAnggota - calculateTotal())}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={submitting}
                    className="flex-1 bg-slate-600 text-slate-300 py-2 sm:py-3 px-3 rounded-xl font-medium hover:bg-slate-500 transition-colors border border-slate-500 disabled:opacity-50 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-2 sm:py-3 px-3 rounded-xl font-medium transition-transform transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center border border-emerald-500 disabled:opacity-60 text-sm"
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white mr-1 sm:mr-2"
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
                        Mengirim...
                      </>
                    ) : (
                      "Lanjut"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
