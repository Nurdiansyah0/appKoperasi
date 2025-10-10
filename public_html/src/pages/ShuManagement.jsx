// src/pages/ShuManagement.jsx
import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function ShuManagement({ user }) {
  const navigate = useNavigate();
  const [shuData, setShuData] = useState([]);
  const [summary, setSummary] = useState({
    totalShu60: 0,
    totalShu10: 0,
    totalShu30: 0,
    totalAllShu: 0,
    totalDistribusi: 0,
    tahunAktif: 'Semua Tahun'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatTanggal = (tanggalString) => {
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
  };

  const loadShuData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await api("getShuDistribusi", "GET");
      
      if (res?.success) {
        // Handle response dengan summary
        if (Array.isArray(res.data)) {
          setShuData(res.data);
          setSummary(res.summary || {
            totalShu60: res.data.reduce((sum, item) => sum + (item.shu_60_percent || 0), 0),
            totalShu10: res.data.reduce((sum, item) => sum + (item.shu_10_percent || 0), 0),
            totalShu30: res.data.reduce((sum, item) => sum + (item.shu_30_percent || 0), 0),
            totalAllShu: res.data.reduce((sum, item) => sum + (item.total_shu || 0), 0),
            totalDistribusi: res.data.length,
            tahunAktif: 'Semua Tahun'
          });
        } else {
          setShuData([]);
          setSummary({
            totalShu60: 0,
            totalShu10: 0,
            totalShu30: 0,
            totalAllShu: 0,
            totalDistribusi: 0,
            tahunAktif: 'Semua Tahun'
          });
        }
      } else {
        setError(res?.error || "Gagal memuat data SHU");
      }
    } catch (err) {
      console.error("Error loading SHU data:", err);
      setError("Terjadi kesalahan saat memuat data SHU");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShuData();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat data SHU...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a] py-4 px-3 sm:px-4">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-32 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[26rem] h-[26rem] rounded-full bg-amber-500/6 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Kelola SHU (Sisa Hasil Usaha)
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Manajemen distribusi Sisa Hasil Usaha koperasi • {summary.tahunAktif}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-slate-700/60 text-slate-300 rounded-xl hover:bg-slate-600/60 transition-colors border border-slate-600/40 text-sm"
            >
              Kembali ke Dashboard
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

        {/* ✅ SUMMARY TOTAL PER KOMPOSISI SHU */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Total SHU 60% */}
          <div className="bg-gradient-to-tr from-green-900/50 to-green-800/40 backdrop-blur-lg border border-green-500/30 rounded-2xl p-4 sm:p-6 text-center">
            <div className="text-green-400 text-xl sm:text-2xl font-bold mb-2">
              {formatCurrency(summary.totalShu60)}
            </div>
            <div className="text-green-200 text-sm font-medium">SHU 60%</div>
            <div className="text-green-300 text-xs mt-1">
              {((summary.totalShu60 / summary.totalAllShu) * 100 || 0).toFixed(1)}% dari total
            </div>
          </div>
          
          {/* Total SHU 10% */}
          <div className="bg-gradient-to-tr from-blue-900/50 to-blue-800/40 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-4 sm:p-6 text-center">
            <div className="text-blue-400 text-xl sm:text-2xl font-bold mb-2">
              {formatCurrency(summary.totalShu10)}
            </div>
            <div className="text-blue-200 text-sm font-medium">SHU 10%</div>
            <div className="text-blue-300 text-xs mt-1">
              {((summary.totalShu10 / summary.totalAllShu) * 100 || 0).toFixed(1)}% dari total
            </div>
          </div>
          
          {/* Total SHU 30% */}
          <div className="bg-gradient-to-tr from-purple-900/50 to-purple-800/40 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-4 sm:p-6 text-center">
            <div className="text-purple-400 text-xl sm:text-2xl font-bold mb-2">
              {formatCurrency(summary.totalShu30)}
            </div>
            <div className="text-purple-200 text-sm font-medium">SHU 30%</div>
            <div className="text-purple-300 text-xs mt-1">
              {((summary.totalShu30 / summary.totalAllShu) * 100 || 0).toFixed(1)}% dari total
            </div>
          </div>

          {/* Total Keseluruhan */}
          <div className="bg-gradient-to-tr from-amber-900/50 to-amber-800/40 backdrop-blur-lg border border-amber-500/30 rounded-2xl p-4 sm:p-6 text-center">
            <div className="text-amber-400 text-xl sm:text-2xl font-bold mb-2">
              {formatCurrency(summary.totalAllShu)}
            </div>
            <div className="text-amber-200 text-sm font-medium">Total SHU</div>
            <div className="text-amber-300 text-xs mt-1">
              {summary.totalDistribusi} distribusi
            </div>
          </div>
        </div>

        {/* SHU Data Table */}
        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <svg
                className="w-4 h-4 sm:h-5 sm:w-5"
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
              Data Distribusi SHU
            </h2>
            <p className="text-amber-200 text-xs sm:text-sm">
              {summary.totalDistribusi} records ditemukan • {summary.tahunAktif}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Anggota
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Tahun
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    SHU 60%
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    SHU 10%
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    SHU 30%
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600/40">
                {shuData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      <div className="text-4xl mb-2">📊</div>
                      Tidak ada data distribusi SHU
                    </td>
                  </tr>
                ) : (
                  shuData.map((shu) => (
                    <tr key={shu.shu_id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {shu.nama_anggota || `Anggota #${shu.anggota_id}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {shu.anggota_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                        {shu.tahun}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-400 text-right font-medium">
                        {formatCurrency(shu.shu_60_percent)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-400 text-right font-medium">
                        {formatCurrency(shu.shu_10_percent)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-400 text-right font-medium">
                        {formatCurrency(shu.shu_30_percent)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-400 text-right font-bold">
                        {formatCurrency(shu.total_shu)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">
                        {formatTanggal(shu.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={loadShuData}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors border border-amber-500 font-medium"
          >
            Refresh Data
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-slate-600 text-slate-300 rounded-xl hover:bg-slate-500 transition-colors border border-slate-500 font-medium"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}