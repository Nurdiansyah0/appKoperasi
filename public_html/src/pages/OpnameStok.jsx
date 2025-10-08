// src/pages/kasir/OpnameStok.jsx - UI/UX IMPROVED
import React, { useState, useEffect, useRef } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function OpnameStok() {
  const navigate = useNavigate();
  const [barangList, setBarangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [kasirToList, setKasirToList] = useState([]);
  const [selectedKasirTo, setSelectedKasirTo] = useState("");
  const [showKasirDropdown, setShowKasirDropdown] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef(null);

  // Format waktu
  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Clear messages
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Load data barang dan kasir
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load barang
        const resBarang = await api("getDataBarangBelanjaKasir", "GET");
        if (resBarang?.success) {
          const barangWithInput = resBarang.data.map((item) => ({
            ...item,
            stok_input: "",
          }));
          setBarangList(barangWithInput);
        }

        // Load daftar kasir (kecuali yang login)
        const resKasir = await api("getDaftarKasir", "GET");
        if (resKasir?.success) {
          setKasirToList(resKasir.data);
        }
      } catch (err) {
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
        setLastUpdate(new Date());
      }
    };
    loadData();
  }, []);

  // Handle click outside untuk dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowKasirDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter barang berdasarkan search query
  const filteredBarangList = barangList.filter(
    (item) =>
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.barang_id).includes(searchQuery)
  );

  // Handler update stok input
  const updateStokInput = (barangId, newStok) => {
    setBarangList((prev) =>
      prev.map((item) => {
        if (item.barang_id === barangId) {
          return {
            ...item,
            stok_input: newStok === "" ? "" : parseInt(newStok) || 0,
          };
        }
        return item;
      })
    );
  };

  // Hitung summary (hanya yang sudah diisi)
  const calculateSummary = () => {
    const barangTerisi = barangList.filter((item) => item.stok_input !== "");
    const totalBarang = barangList.length;
    const barangBelumDiisi = barangList.filter(
      (item) => item.stok_input === ""
    ).length;
    const barangSudahDiisi = barangTerisi.length;

    return { totalBarang, barangBelumDiisi, barangSudahDiisi };
  };

  // Validasi sebelum submit
  const validateForm = () => {
    const barangBelumDiisi = barangList.filter(
      (item) => item.stok_input === ""
    ).length;
    if (barangBelumDiisi > 0) {
      setError(
        `Masih ada ${barangBelumDiisi} barang yang belum diisi stok input`
      );
      return false;
    }
    return true;
  };

  // Submit opname
  const submitOpname = async () => {
    if (!selectedKasirTo) {
      setError("Pilih kasir penerima terlebih dahulu");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Hitung selisih dan status untuk disimpan
      const itemsWithCalculation = barangList.map((item) => ({
        barang_id: item.barang_id,
        nama_barang: item.nama_barang,
        stok_aktual: item.stok,
        stok_input: item.stok_input,
        selisih: item.stok_input - item.stok,
        status: item.stok_input - item.stok === 0 ? "sesuai" : "selisih",
      }));

      const summary = {
        totalBarang: barangList.length,
        barangSesuai: itemsWithCalculation.filter(
          (item) => item.status === "sesuai"
        ).length,
        barangSelisih: itemsWithCalculation.filter(
          (item) => item.status === "selisih"
        ).length,
        totalSelisih: itemsWithCalculation.reduce(
          (sum, item) => sum + item.selisih,
          0
        ),
      };

      const hasil_opname = {
        summary: summary,
        items: itemsWithCalculation,
        timestamp: new Date().toISOString(),
      };

      const payload = {
        kasir_to: parseInt(selectedKasirTo),
        hasil_opname: hasil_opname,
      };

      const res = await api("getSerahTerima", "POST", payload);

      if (res?.success) {
        setSuccess("Opname berhasil disimpan dan dikirim ke kasir penerima!");
        // Reset form
        setBarangList((prev) =>
          prev.map((item) => ({
            ...item,
            stok_input: "",
          }))
        );
        setSelectedKasirTo("");
        setSearchQuery("");
      } else {
        throw new Error(res?.error || "Gagal menyimpan opname");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = calculateSummary();
  const selectedKasir = kasirToList.find(
    (kasir) => kasir.user_id == selectedKasirTo
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat data opname...</p>
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

      <div className="relative z-10 container mx-auto max-w-6xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Opname Stok - Serah Terima Kasir
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Input stok fisik untuk serah terima shift kasir
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
        {(error || success) && (
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
            {success && (
              <div className="bg-green-900/50 border border-green-500/30 text-green-300 px-3 py-2 sm:px-4 sm:py-3 rounded-xl backdrop-blur-lg flex justify-between items-center">
                <span className="text-sm">{success}</span>
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
              <strong>Petunjuk:</strong> Input stok fisik yang Anda hitung
              secara manual. Data akan dikirim ke kasir penerima untuk review
              dan serah terima shift.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {summary.totalBarang}
                </div>
                <div className="text-slate-400 text-sm">Total Barang</div>
              </div>
              <div className="bg-gradient-to-tr from-yellow-900/50 to-yellow-800/40 backdrop-blur-lg border border-yellow-500/30 rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">
                  {summary.barangBelumDiisi}
                </div>
                <div className="text-yellow-300 text-sm">Belum Diisi</div>
              </div>
              <div className="bg-gradient-to-tr from-emerald-900/50 to-emerald-800/40 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1">
                  {summary.barangSudahDiisi}
                </div>
                <div className="text-emerald-300 text-sm">Sudah Diisi</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl p-3 sm:p-4">
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
                  placeholder="Cari barang..."
                  className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 text-sm w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Products Table */}
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
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  Daftar Barang
                </h2>
                <p className="text-indigo-200 text-xs sm:text-sm">
                  {filteredBarangList.length} dari {barangList.length} barang{" "}
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
                            Barang
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Stok Input
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600/40">
                        {filteredBarangList.map((item) => (
                          <tr
                            key={item.barang_id}
                            className="hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">
                                {item.nama_barang}
                              </div>
                              <div className="text-xs text-slate-400">
                                ID: {item.barang_id}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-900/50 text-blue-300 border border-blue-500/30">
                                {item.stok} pcs
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                              <input
                                type="number"
                                value={item.stok_input}
                                onChange={(e) =>
                                  updateStokInput(
                                    item.barang_id,
                                    e.target.value
                                  )
                                }
                                className="bg-slate-900/60 border border-slate-600/40 rounded-lg px-3 py-2 text-white text-sm w-24 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="0"
                                min="0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-2 p-3">
                    {filteredBarangList.map((item) => (
                      <div
                        key={item.barang_id}
                        className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/40"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm">
                              {item.nama_barang}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID: {item.barang_id}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            Stok Input:
                          </span>
                          <input
                            type="number"
                            value={item.stok_input}
                            onChange={(e) =>
                              updateStokInput(item.barang_id, e.target.value)
                            }
                            className="bg-slate-900/60 border border-slate-600/40 rounded-lg px-3 py-2 text-white text-sm w-20 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredBarangList.length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-400">
                      <div className="text-4xl mb-2">📦</div>
                      {searchQuery
                        ? `Tidak ada barang ditemukan untuk "${searchQuery}"`
                        : "Tidak ada barang yang tersedia"}
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Serah Terima
                </h2>
              </div>

              <div className="p-3 sm:p-4 space-y-4">
                {/* Kasir Penerima */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Kasir Penerima Shift
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKasirDropdown(!showKasirDropdown)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-600/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-900/60 text-white text-left flex justify-between items-center transition-all hover:border-slate-500"
                  >
                    <span className="text-sm truncate">
                      {selectedKasir
                        ? `${selectedKasir.nama_lengkap} - ${selectedKasir.username}`
                        : "Pilih Kasir Penerima"}
                    </span>
                    <span className="text-slate-400 transform transition-transform text-xs flex-shrink-0">
                      {showKasirDropdown ? "▲" : "▼"}
                    </span>
                  </button>

                  {showKasirDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600/40 rounded-xl shadow-lg backdrop-blur-lg max-h-60 overflow-y-auto">
                      {kasirToList.map((kasir) => (
                        <button
                          key={kasir.user_id}
                          type="button"
                          onClick={() => {
                            setSelectedKasirTo(kasir.user_id);
                            setShowKasirDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-sm text-white text-left hover:bg-slate-700/60 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-slate-600/40 last:border-b-0"
                        >
                          <div className="font-medium">
                            {kasir.nama_lengkap}
                          </div>
                          <div className="text-xs text-slate-400">
                            {kasir.username}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/40">
                  <div className="text-sm font-medium text-slate-300 mb-2">
                    Progress Pengisian
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Terkisi</span>
                      <span>
                        {summary.barangSudahDiisi} / {summary.totalBarang}
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (summary.barangSudahDiisi / summary.totalBarang) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-400 text-center">
                      {Math.round(
                        (summary.barangSudahDiisi / summary.totalBarang) * 100
                      )}
                      % selesai
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitOpname}
                  disabled={
                    submitting ||
                    !selectedKasirTo ||
                    summary.barangSudahDiisi !== summary.totalBarang
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
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                      Simpan & Serah Terima
                    </>
                  )}
                </button>

                {/* Validation Info */}
                {!selectedKasirTo && (
                  <div className="text-amber-400 text-xs text-center bg-amber-900/50 p-2 rounded-xl border border-amber-500/30">
                    Pilih kasir penerima terlebih dahulu
                  </div>
                )}
                {selectedKasirTo &&
                  summary.barangSudahDiisi !== summary.totalBarang && (
                    <div className="text-amber-400 text-xs text-center bg-amber-900/50 p-2 rounded-xl border border-amber-500/30">
                      Isi semua stok input sebelum submit
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
