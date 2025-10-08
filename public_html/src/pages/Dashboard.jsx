// src/pages/Dashboard.jsx - FULL SCRIPT DENGAN SHU DISTRIBUSI (FIXED)
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function DashboardAdmin({ user }) {
  const [stats, setStats] = useState({
    totalBarang: 0,
    totalAnggota: 0,
    totalKasir: 0,
    setoranPending: 0,
    totalTransaksiHariIni: 0,
    pendapatanHariIni: 0,
  });
  const [shuData, setShuData] = useState({
    data: [],
    summary: {
      totalShu: 0,
      totalDistribusi: 0,
      tahunAktif: new Date().getFullYear(),
      summaryByYear: [],
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [setoranList, setSetoranList] = useState([]);
  const [topupMember, setTopupMember] = useState({
    username: "",
    nominal: 0,
    anggota_id: null,
  });
  const [anggotaList, setAnggotaList] = useState([]);
  const [searchAnggota, setSearchAnggota] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }, []);

  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  const formatTanggal = useCallback((tanggalString) => {
    try {
      const date = new Date(tanggalString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return tanggalString;
    }
  }, []);

  const formatTanggalSingkat = useCallback((tanggalString) => {
    try {
      const date = new Date(tanggalString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return tanggalString;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError("");
    setSuccessMessage("");
  }, []);

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError("");

    try {
      const [
        barangRes,
        anggotaRes,
        kasirRes,
        setoranRes,
        transaksiRes,
        shuRes,
      ] = await Promise.allSettled([
        api("getDataBarang", "GET"),
        api("getDataAnggota", "GET"),
        api("getDataKasir", "GET"),
        api("getSetoranKasir", "GET"),
        api("getTransaksiHariIni", "GET"),
        api("getShuDistribusi", "GET"),
      ]);

      const newStats = {
        totalBarang:
          barangRes.status === "fulfilled" && barangRes.value?.success
            ? barangRes.value.data?.length || barangRes.value.length || 0
            : 0,

        totalAnggota:
          anggotaRes.status === "fulfilled" && anggotaRes.value?.success
            ? anggotaRes.value.data?.length || anggotaRes.value.length || 0
            : 0,

        totalKasir:
          kasirRes.status === "fulfilled" && kasirRes.value?.success
            ? kasirRes.value.data?.length || kasirRes.value.length || 0
            : 0,

        setoranPending:
          setoranRes.status === "fulfilled" && setoranRes.value?.success
            ? setoranRes.value.data?.length || setoranRes.value.length || 0
            : 0,

        totalTransaksiHariIni:
          transaksiRes.status === "fulfilled" && transaksiRes.value?.success
            ? transaksiRes.value.data?.total_transaksi ||
              transaksiRes.value.total_transaksi ||
              0
            : 0,

        pendapatanHariIni:
          transaksiRes.status === "fulfilled" && transaksiRes.value?.success
            ? transaksiRes.value.data?.total_pendapatan ||
              transaksiRes.value.total_pendapatan ||
              0
            : 0,
      };

      setStats(newStats);

      // PERBAIKAN: Handle SHU Distribusi Data dengan benar
      if (shuRes.status === "fulfilled" && shuRes.value?.success) {
        console.log("SHU API Response:", shuRes.value); // Debug log

        // Jika response memiliki struktur {data: [], summary: {}}
        if (shuRes.value.data && Array.isArray(shuRes.value.data)) {
          setShuData({
            data: shuRes.value.data,
            summary: shuRes.value.summary || {
              totalShu: shuRes.value.data.reduce(
                (sum, item) => sum + (item.total_shu || 0),
                0
              ),
              totalDistribusi: shuRes.value.data.length,
              tahunAktif: new Date().getFullYear(),
              summaryByYear: [],
            },
          });
        }
        // Jika response langsung berisi array
        else if (Array.isArray(shuRes.value)) {
          setShuData({
            data: shuRes.value,
            summary: {
              totalShu: shuRes.value.reduce(
                (sum, item) => sum + (item.total_shu || 0),
                0
              ),
              totalDistribusi: shuRes.value.length,
              tahunAktif: new Date().getFullYear(),
              summaryByYear: [],
            },
          });
        }
        // Jika response tidak sesuai struktur yang diharapkan
        else {
          console.warn("Struktur SHU response tidak dikenali:", shuRes.value);
          setShuData({
            data: [],
            summary: {
              totalShu: 0,
              totalDistribusi: 0,
              tahunAktif: new Date().getFullYear(),
              summaryByYear: [],
            },
          });
        }
      } else {
        console.log("SHU Response Error:", shuRes);
        // Fallback jika API SHU belum tersedia
        setShuData({
          data: [],
          summary: {
            totalShu: 0,
            totalDistribusi: 0,
            tahunAktif: new Date().getFullYear(),
            summaryByYear: [],
          },
        });
      }

      if (setoranRes.status === "fulfilled" && setoranRes.value?.success) {
        const setoranData = setoranRes.value.data || setoranRes.value;
        if (Array.isArray(setoranData)) {
          setSetoranList(setoranData);
        }
      }

      if (anggotaRes.status === "fulfilled" && anggotaRes.value?.success) {
        const anggotaData = anggotaRes.value.data || anggotaRes.value;
        if (Array.isArray(anggotaData)) {
          setAnggotaList(anggotaData);
        }
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Gagal memuat data dashboard");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
      setLastUpdate(new Date());
    }
  };

  const loadSetoran = async () => {
    try {
      const res = await api("getSetoranKasir", "GET");
      if (res && res.success && Array.isArray(res.data)) {
        setSetoranList(res.data);
      }
    } catch (err) {
      console.error("loadSetoran error:", err);
    }
  };

  const approveSetoran = async (id) => {
    try {
      const res = await api("approveSetoranKasir", "POST", { setoran_id: id });
      if (res && res.success) {
        setSuccessMessage("Setoran berhasil diapprove!");
        await loadSetoran();
        await loadDashboardData(true);

        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        setError(res?.error || "Gagal approve setoran");
      }
    } catch (err) {
      console.error(err);
      setError("Error saat approve setoran");
    }
  };

  const submitTopup = async () => {
    if (!topupMember.username || topupMember.nominal <= 0) {
      return setError("Pilih anggota dan isi nominal yang valid");
    }

    try {
      const payload = {
        anggota_id: topupMember.anggota_id,
        username: topupMember.username,
        nominal: Number(topupMember.nominal),
      };

      const res = await api("topupMemberSHU", "POST", payload);
      if (res && res.success) {
        const successMsg = `Topup berhasil! Saldo ${
          topupMember.username
        } bertambah ${formatCurrency(topupMember.nominal)}`;
        setSuccessMessage(successMsg);
        setTopupMember({ username: "", nominal: 0, anggota_id: null });
        await loadDashboardData(true);

        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        setError(res?.error || "Gagal melakukan topup");
      }
    } catch (err) {
      console.error("submitTopup error:", err);
      setError(
        "Error saat topup member: " + (err.message || "Terjadi kesalahan")
      );
    }
  };

  const selectAnggota = (anggota) => {
    setTopupMember({
      username: anggota.username || anggota.nama || anggota.name,
      nominal: 0,
      anggota_id: anggota.anggota_id || anggota.id,
    });
    setSearchAnggota("");
  };

  const filteredAnggota = anggotaList
    .filter((anggota) => {
      if (!searchAnggota.trim()) return true;
      const searchLower = searchAnggota.toLowerCase();
      return (
        (anggota.username || "").toLowerCase().includes(searchLower) ||
        String(anggota.anggota_id || "").includes(searchLower)
      );
    })
    .slice(0, 3);

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat dashboard admin...</p>
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
              Dashboard Admin
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Selamat datang, {user?.username || "Admin"}! Di Kelola sistem
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-300">
              Status: <span className="font-medium text-green-400">Aktif</span>
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

        {/* Stats Cards - PERBAIKAN: Hanya Total SHU dan Pendapatan Hari Ini */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Total SHU */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-cyan-500/20 rounded-xl">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-slate-400">Total SHU</p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {formatCurrency(shuData.summary.totalShu)}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {shuData.summary.totalDistribusi} distribusi
                </p>
              </div>
            </div>
          </div>

          {/* Pendapatan Hari Ini */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-emerald-500/20 rounded-xl">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-slate-400">
                  Pendapatan Hari Ini
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {formatCurrency(stats.pendapatanHariIni)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Utama Admin */}
        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <svg
                className="w-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Menu Utama Admin
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <Link
                to="/stok"
                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-blue-500 hover:to-blue-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-blue-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">
                    Kelola Stok
                  </span>
                </div>
              </Link>

              <Link
                to="/anggota"
                className="bg-gradient-to-br from-green-600 to-green-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-green-500 hover:to-green-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-green-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">
                    Kelola Anggota
                  </span>
                </div>
              </Link>

              <Link
                to="/kasir-management"
                className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-purple-500 hover:to-purple-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-purple-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">
                    Kelola Kasir
                  </span>
                </div>
              </Link>

              <Link
                to="/laporan"
                className="bg-gradient-to-br from-orange-600 to-orange-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-orange-500 hover:to-orange-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-orange-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">
                    Laporan
                  </span>
                </div>
              </Link>

              <Link
                to="/shu"
                className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-amber-500 hover:to-amber-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-amber-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">
                    Kelola SHU
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Distribusi SHU */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-3 sm:px-4 py-3">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Distribusi SHU
              </h2>
              <p className="text-cyan-200 text-xs sm:text-sm">
                {shuData.summary?.totalDistribusi || 0} distribusi pada{" "}
                {shuData.summary?.tahunAktif || new Date().getFullYear()}
              </p>
            </div>

            <div className="p-3 sm:p-4">
              {!shuData.data || shuData.data.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-500 text-4xl mb-2">📊</div>
                  <p className="text-slate-400 text-sm">
                    Belum ada data distribusi SHU
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Data distribusi SHU akan muncul di sini
                  </p>
                  <button
                    onClick={() => loadDashboardData(true)}
                    className="mt-3 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                  >
                    Refresh Data
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {shuData.data.slice(0, 5).map((shu) => (
                    <div
                      key={shu.shu_id}
                      className="bg-slate-700/40 p-3 sm:p-4 rounded-xl border border-slate-600/40 backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm sm:text-base">
                            {shu.nama_anggota || `Anggota #${shu.anggota_id}`}
                          </p>
                          <p className="text-slate-400 text-xs sm:text-sm">
                            Tahun {shu.tahun} •{" "}
                            {formatTanggalSingkat(shu.created_at)}
                          </p>
                        </div>
                        <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full text-xs sm:text-sm border border-cyan-500/30">
                          {formatCurrency(
                            shu.total_shu ||
                              shu.shu_60_percent +
                                shu.shu_10_percent +
                                shu.shu_30_percent
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-green-400 font-medium">60%</p>
                          <p className="text-white">
                            {formatCurrency(shu.shu_60_percent)}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-blue-400 font-medium">10%</p>
                          <p className="text-white">
                            {formatCurrency(shu.shu_10_percent)}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <p className="text-purple-400 font-medium">30%</p>
                          <p className="text-white">
                            {formatCurrency(shu.shu_30_percent)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {shuData.data.length > 5 && (
                    <div className="text-center pt-2">
                      <Link
                        to="/shu"
                        className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                      >
                        Lihat semua {shuData.data.length} distribusi →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Approval Setoran Kasir */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-3 sm:px-4 py-3">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <svg
                  className="w-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Approval Setoran Kasir
              </h2>
              <p className="text-amber-200 text-xs sm:text-sm">
                {setoranList.length} setoran menunggu approval
              </p>
            </div>

            <div className="p-3 sm:p-4">
              {setoranList.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-500 text-4xl mb-2">💰</div>
                  <p className="text-slate-400 text-sm">
                    Tidak ada setoran menunggu
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Setoran dari kasir akan muncul di sini
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {setoranList.map((s) => (
                    <div
                      key={s.id}
                      className="bg-slate-700/40 p-3 sm:p-4 rounded-xl border border-slate-600/40 backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm sm:text-base">
                            {s.nama_kasir}
                          </p>
                          <p className="text-slate-400 text-xs sm:text-sm">
                            {formatTanggal(s.tanggal)}
                          </p>
                        </div>
                        <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full text-xs sm:text-sm border border-amber-500/30">
                          {formatCurrency(s.nominal || 0)}
                        </span>
                      </div>
                      <button
                        onClick={() => approveSetoran(s.id)}
                        className="w-full rounded-xl bg-amber-600 text-white py-2 px-3 text-sm font-medium hover:bg-amber-700 active:scale-95 transition-all border border-amber-500"
                      >
                        Approve Setoran
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Topup Saldo Member dari SHU */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 sm:px-4 py-3">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <svg
                  className="w-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                Topup Saldo Member
              </h2>
              <p className="text-emerald-200 text-xs sm:text-sm">
                Transfer SHU ke saldo aktif
              </p>
            </div>

            <div className="p-3 sm:p-4">
              {/* Search Anggota */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Cari anggota (nama, ID)..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  value={searchAnggota}
                  onChange={(e) => setSearchAnggota(e.target.value)}
                />
              </div>

              {/* Daftar Anggota */}
              <div className="mb-4">
                <h3 className="text-white font-medium text-sm mb-2">
                  Pilih Anggota:
                </h3>
                {filteredAnggota.length === 0 ? (
                  <div className="text-center py-4 bg-slate-700/30 rounded-lg border border-slate-600/40">
                    <p className="text-slate-400 text-sm">
                      {searchAnggota
                        ? "Tidak ada anggota yang cocok"
                        : "Tidak ada data anggota"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filteredAnggota.map((anggota) => (
                      <div
                        key={anggota.anggota_id || anggota.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          topupMember.anggota_id ===
                          (anggota.anggota_id || anggota.id)
                            ? "bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/50"
                            : "bg-slate-700/30 border-slate-600/40 hover:border-emerald-500/50"
                        }`}
                        onClick={() => selectAnggota(anggota)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium text-sm">
                              {anggota.username || anggota.nama || "N/A"}
                            </p>
                            <p className="text-slate-400 text-xs">
                              ID: {anggota.anggota_id || anggota.id}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-400 text-sm font-medium">
                              {formatCurrency(anggota.saldo || 0)}
                            </p>
                            {anggota.shu && (
                              <p className="text-amber-400 text-xs">
                                SHU: {formatCurrency(anggota.shu)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Topup */}
              <div className="space-y-3">
                <div>
                  <label className="text-slate-300 text-sm mb-1 block">
                    Anggota Terpilih
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    value={topupMember.username}
                    readOnly
                    placeholder="Pilih anggota dari daftar di atas"
                  />
                </div>

                <div>
                  <label className="text-slate-300 text-sm mb-1 block">
                    Nominal Topup
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    value={topupMember.nominal || ""}
                    onChange={(e) =>
                      setTopupMember({
                        ...topupMember,
                        nominal: Number(e.target.value),
                      })
                    }
                    min="1"
                    placeholder="Masukkan nominal"
                  />
                </div>

                <button
                  onClick={submitTopup}
                  disabled={!topupMember.username || topupMember.nominal <= 0}
                  className={`w-full rounded-xl py-2 px-3 text-sm font-medium transition-all ${
                    !topupMember.username || topupMember.nominal <= 0
                      ? "bg-slate-600 text-slate-400 cursor-not-allowed border border-slate-500"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 border border-emerald-500"
                  }`}
                >
                  Topup Saldo dari SHU
                </button>
              </div>

              {/* Informasi */}
              <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                <p className="text-amber-200 text-xs">
                  💡 <strong>Catatan:</strong> Topup saldo akan mengurangi SHU
                  anggota dan menambah saldo aktif. Pastikan anggota memiliki
                  cukup SHU sebelum melakukan topup.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-refresh Info */}
        <div className="text-center text-xs text-slate-500">
          Data diperbarui otomatis setiap 30 detik
        </div>
      </div>
    </div>
  );
}
