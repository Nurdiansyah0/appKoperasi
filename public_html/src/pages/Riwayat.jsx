// src/pages/Riwayat.jsx - UI/UX IMPROVED
import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Riwayat({ anggotaId: propAnggotaId = null }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMetode, setFilterMetode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistori = async (id = null) => {
    setLoading(true);
    setError(null);
    try {
      const query = id ? `anggota_id=${encodeURIComponent(id)}` : null;
      const histRes = await api("getHistoriTransaksi", "GET", null, query);

      if (histRes?.success && Array.isArray(histRes.data)) {
        setTransactions(histRes.data);
      } else {
        console.warn("getHistoriTransaksi response:", histRes);
        setTransactions([]);
        if (histRes && !histRes.success)
          setError(
            histRes.error || histRes.message || "Tidak bisa ambil histori"
          );
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal memuat histori");
      setTransactions([]);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchHistori(propAnggotaId);
  }, [propAnggotaId]);

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const statusMatch =
      filterStatus === "all" || transaction.status === filterStatus;
    const metodeMatch =
      filterMetode === "all" || transaction.metode_pembayaran === filterMetode;

    // Search filter
    const searchMatch =
      !searchQuery ||
      transaction.items?.some((item) =>
        item.nama_barang?.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      String(transaction.id_transaksi || "").includes(searchQuery);

    return statusMatch && metodeMatch && searchMatch;
  });

  const formatCurrency = (amount) =>
    amount
      ? new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(amount)
      : "Rp 0";

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Fungsi untuk styling metode pembayaran
  const getMetodePembayaranStyle = (metode) => {
    switch (metode) {
      case "cash":
        return "bg-green-900/50 text-green-300 border-green-500/30";
      case "transfer":
        return "bg-blue-900/50 text-blue-300 border-blue-500/30";
      case "hutang":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-500/30";
      case "ewallet":
        return "bg-purple-900/50 text-purple-300 border-purple-500/30";
      case "qr":
        return "bg-indigo-900/50 text-indigo-300 border-indigo-500/30";
      default:
        return "bg-slate-900/50 text-slate-300 border-slate-500/30";
    }
  };

  // Fungsi untuk styling status
  const getStatusStyle = (status) => {
    switch (status) {
      case "selesai":
        return "bg-emerald-900/50 text-emerald-300 border-emerald-500/30";
      case "pending":
        return "bg-amber-900/50 text-amber-300 border-amber-500/30";
      case "ditolak":
        return "bg-red-900/50 text-red-300 border-red-500/30";
      default:
        return "bg-slate-900/50 text-slate-300 border-slate-500/30";
    }
  };

  // Get metode label
  const getMetodeLabel = (metode) => {
    switch (metode) {
      case "cash":
        return "Cash";
      case "transfer":
        return "Transfer";
      case "hutang":
        return "Hutang";
      case "ewallet":
        return "E-Wallet";
      case "qr":
        return "QR Code";
      default:
        return metode || "-";
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case "selesai":
        return "Selesai";
      case "pending":
        return "Pending";
      case "ditolak":
        return "Ditolak";
      default:
        return status || "-";
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Hitung total
  const totalSelesai = transactions.filter(
    (t) => t.status === "selesai"
  ).length;
  const totalPending = transactions.filter(
    (t) => t.status === "pending"
  ).length;
  const totalDitolak = transactions.filter(
    (t) => t.status === "ditolak"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat riwayat transaksi...</p>
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
              Riwayat Transaksi
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Lihat semua riwayat transaksi yang pernah dilakukan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
              🔄 {formatTime(lastUpdate)}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-slate-700/60 text-slate-300 rounded-xl hover:bg-slate-600/60 transition-colors border border-slate-600/40 text-sm"
            >
              Kembali
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-500/30 text-red-300 px-3 py-2 sm:px-4 sm:py-3 rounded-xl backdrop-blur-lg flex justify-between items-center">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-200 transition-colors ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Info Panel */}
        <div className="bg-gradient-to-tr from-blue-900/50 to-blue-800/40 backdrop-blur-lg border border-blue-500/30 text-blue-200 px-3 py-2 sm:px-4 sm:py-3 rounded-xl">
          <div className="flex items-center gap-3">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-sm">
              <strong>Informasi:</strong> Data transaksi akan diperbarui
              otomatis. Gunakan filter untuk melihat data spesifik berdasarkan
              status atau metode pembayaran.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {transactions.length}
                </div>
                <div className="text-slate-400 text-sm">Total Transaksi</div>
              </div>
              <div className="bg-gradient-to-tr from-emerald-900/50 to-emerald-800/40 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1">
                  {totalSelesai}
                </div>
                <div className="text-emerald-300 text-sm">Selesai</div>
              </div>
              <div className="bg-gradient-to-tr from-amber-900/50 to-amber-800/40 backdrop-blur-lg border border-amber-500/30 rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400 mb-1">
                  {totalPending}
                </div>
                <div className="text-amber-300 text-sm">Pending</div>
              </div>
              <div className="bg-gradient-to-tr from-red-900/50 to-red-800/40 backdrop-blur-lg border border-red-500/30 rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">
                  {totalDitolak}
                </div>
                <div className="text-red-300 text-sm">Ditolak</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl p-3 sm:p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Bar */}
                <div className="md:col-span-1">
                  <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2 transition-shadow focus-within:shadow-lg">
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
                      placeholder="Cari produk atau ID transaksi..."
                      className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 text-sm w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Filter Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-600/40 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">Semua Status</option>
                    <option value="selesai">Selesai</option>
                    <option value="pending">Pending</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>

                {/* Metode Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Filter Metode
                  </label>
                  <select
                    value={filterMetode}
                    onChange={(e) => setFilterMetode(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-600/40 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">Semua Metode</option>
                    <option value="cash">Cash</option>
                    <option value="transfer">Transfer</option>
                    <option value="hutang">Hutang</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="qr">QR Code</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Daftar Transaksi
                </h2>
                <p className="text-indigo-200 text-xs sm:text-sm">
                  {filteredTransactions.length} dari {transactions.length}{" "}
                  transaksi
                  {searchQuery && ` • "${searchQuery}"`}
                </p>
              </div>

              <div className="overflow-hidden">
                <div className="min-w-0">
                  <div className="hidden sm:block">
                    <table className="w-full">
                      <thead className="bg-slate-700/40">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Tanggal & ID
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Produk
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Jumlah
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Metode
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600/40">
                        {filteredTransactions.map((transaction, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">
                                {formatDate(
                                  transaction.created_at ??
                                    transaction.tanggal_transaksi
                                )}
                              </div>
                              <div className="text-xs text-slate-400">
                                ID:{" "}
                                {transaction.id_transaksi || `TRX-${idx + 1}`}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              <div className="text-sm text-white max-w-xs">
                                {transaction.items
                                  ?.map((i) => i.nama_barang)
                                  .join(", ") ?? "-"}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                              <div className="text-sm text-white">
                                {transaction.items?.reduce(
                                  (sum, i) => sum + (i.jumlah || 0),
                                  0
                                ) ?? "-"}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                              <div className="text-sm font-semibold text-emerald-400">
                                {formatCurrency(transaction.total_harga ?? 0)}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getMetodePembayaranStyle(
                                  transaction.metode_pembayaran
                                )}`}
                              >
                                {getMetodeLabel(transaction.metode_pembayaran)}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(
                                  transaction.status
                                )}`}
                              >
                                {getStatusLabel(transaction.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-2 p-3">
                    {filteredTransactions.map((transaction, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/40"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm mb-1">
                              {formatDate(
                                transaction.created_at ??
                                  transaction.tanggal_transaksi
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mb-2">
                              ID: {transaction.id_transaksi || `TRX-${idx + 1}`}
                            </div>
                            <div className="text-sm text-white">
                              {transaction.items
                                ?.map((i) => i.nama_barang)
                                .join(", ") ?? "-"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Jumlah:</span>
                            <div className="text-white font-medium">
                              {transaction.items?.reduce(
                                (sum, i) => sum + (i.jumlah || 0),
                                0
                              ) ?? "-"}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Total:</span>
                            <div className="text-emerald-400 font-medium">
                              {formatCurrency(transaction.total_harga ?? 0)}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getMetodePembayaranStyle(
                              transaction.metode_pembayaran
                            )}`}
                          >
                            {getMetodeLabel(transaction.metode_pembayaran)}
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(
                              transaction.status
                            )}`}
                          >
                            {getStatusLabel(transaction.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredTransactions.length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-400">
                      <div className="text-4xl mb-2">📦</div>
                      {transactions.length === 0
                        ? "Belum ada transaksi"
                        : "Tidak ada transaksi yang sesuai dengan filter"}
                      <p className="text-sm mt-2">
                        {transactions.length === 0
                          ? "Mulai lakukan transaksi pertama Anda."
                          : "Coba ubah filter atau kata kunci pencarian."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl sticky top-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Statistik
                </h2>
              </div>

              <div className="p-3 sm:p-4 space-y-4">
                {/* Progress Ringkasan */}
                <div className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/40">
                  <div className="text-sm font-medium text-slate-300 mb-3">
                    Ringkasan Status
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Selesai</span>
                      <span className="text-xs text-emerald-400 font-medium">
                        {totalSelesai}
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-1">
                      <div
                        className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (totalSelesai / transactions.length) * 100
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Pending</span>
                      <span className="text-xs text-amber-400 font-medium">
                        {totalPending}
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-1">
                      <div
                        className="bg-amber-500 h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (totalPending / transactions.length) * 100
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Ditolak</span>
                      <span className="text-xs text-red-400 font-medium">
                        {totalDitolak}
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-1">
                      <div
                        className="bg-red-500 h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (totalDitolak / transactions.length) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Info Panel */}
                <div className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/40">
                  <div className="text-sm font-medium text-slate-300 mb-2">
                    Informasi
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>• Data diperbarui otomatis</div>
                    <div>
                      • Filter aktif:{" "}
                      {filterStatus === "all" ? "Semua Status" : filterStatus}
                    </div>
                    <div>
                      • Total ditampilkan: {filteredTransactions.length}
                    </div>
                  </div>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => fetchHistori(propAnggotaId)}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2 sm:py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm sm:text-base border border-indigo-500"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
