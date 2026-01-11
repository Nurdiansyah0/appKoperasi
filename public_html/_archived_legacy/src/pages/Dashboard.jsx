// src/pages/Dashboard.jsx - LIGHT THEME (REFAC FIXED)
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

      // Handle SHU Distribusi Data
      if (shuRes.status === "fulfilled" && shuRes.value?.success) {
        if (shuRes.value.data && Array.isArray(shuRes.value.data)) {
          setShuData({
            data: shuRes.value.data,
            summary: shuRes.value.summary || {
              totalShu: shuRes.value.data.reduce((sum, item) => sum + (item.total_shu || 0), 0),
              totalDistribusi: shuRes.value.data.length,
              tahunAktif: new Date().getFullYear(),
              summaryByYear: [],
            },
          });
        }
        else if (Array.isArray(shuRes.value)) {
          setShuData({
            data: shuRes.value,
            summary: {
              totalShu: shuRes.value.reduce((sum, item) => sum + (item.total_shu || 0), 0),
              totalDistribusi: shuRes.value.length,
              tahunAktif: new Date().getFullYear(),
              summaryByYear: [],
            },
          });
        }
      }

      if (setoranRes.status === "fulfilled" && setoranRes.value?.success) {
        const setoranData = setoranRes.value.data || setoranRes.value;
        if (Array.isArray(setoranData)) {
          setSetoranList(setoranData);
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
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError(res?.error || "Gagal approve setoran");
      }
    } catch (err) {
      console.error(err);
      setError("Error saat approve setoran");
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Hello, {user?.username}! Berikut ringkasan hari ini.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            ● Sistem Aktif
          </div>
          <div className="text-xs text-gray-400">
            Updated: {formatTime(lastUpdate)}
          </div>
        </div>
      </div>

      {/* Messages */}
      {(error || successMessage) && (
        <div className="rounded-xl overflow-hidden shadow-sm">
          {error && <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500 flex justify-between">{error} <button onClick={clearMessages}>✕</button></div>}
          {successMessage && <div className="p-4 bg-green-50 text-green-700 border-l-4 border-green-500 flex justify-between">{successMessage} <button onClick={clearMessages}>✕</button></div>}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pendapatan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pendapatan Hari Ini</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.pendapatanHariIni)}</p>
            <p className="text-xs text-green-600 mt-1">+{stats.totalTransaksiHariIni} transaksi</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
          </div>
        </div>

        {/* Stok Barang */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Produk</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalBarang}</p>
            <Link to="/stok" className="text-xs text-orange-500 hover:text-orange-600 font-medium mt-1 inline-block">Kelola Stok →</Link>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
        </div>

        {/* Total Anggota */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Anggota</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalAnggota}</p>
            <Link to="/anggota" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium mt-1 inline-block">Lihat Anggota →</Link>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
        </div>

        {/* Pending Setoran */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Setoran Pending</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.setoranPending}</p>
            <span className="text-xs text-amber-500 mt-1 block">Perlu approval segera</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi SHU */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-gray-800">Distribusi SHU Terbaru</h3>
            <Link to="/shu-management" className="text-xs font-medium text-orange-500 hover:text-orange-600">Lihat Semua</Link>
          </div>
          <div className="p-6">
            {!shuData.data || shuData.data.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Belum ada data distribusi</div>
            ) : (
              <div className="space-y-4">
                {shuData.data.slice(0, 4).map((shu) => (
                  <div key={shu.shu_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{shu.nama_anggota}</p>
                      <p className="text-xs text-gray-400">{formatTanggal(shu.created_at)}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(shu.total_shu || (shu.shu_60_percent + shu.shu_10_percent + shu.shu_30_percent))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Approval Setoran Kasir */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-gray-800">Request Setoran Kasir</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{setoranList.length} Pending</span>
          </div>
          <div className="p-6">
            {setoranList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Tidak ada request setoran</div>
            ) : (
              <div className="space-y-4">
                {setoranList.map((s) => (
                  <div key={s.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-800">{s.nama_kasir}</p>
                      <p className="text-xs text-gray-500">{formatTanggal(s.tanggal)}</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(s.nominal)}</p>
                    </div>
                    <button onClick={() => approveSetoran(s.id)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-amber-500/30">
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
