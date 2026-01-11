// src/pages/KelolaAnggota.jsx - UI/UX SAMA PERSIS DENGAN KASIR.JSX
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function KelolaAnggota() {
  const [anggota, setAnggota] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTambahForm, setShowTambahForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "anggota",
  });
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

  const clearMessages = useCallback(() => {
    setError("");
    setSuccessMessage("");
  }, []);

  const loadAnggota = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api("getDataAnggota", "GET");
      if (res && res.success) {
        setAnggota(res.data);
      } else {
        throw new Error(res?.error || "Gagal memuat data anggota");
      }
    } catch (err) {
      console.error("Error loading anggota:", err);
      setError(err.message || "Gagal memuat data anggota");
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    loadAnggota();
  }, []);

  const tambahUser = async () => {
    try {
      if (!newUser.username || !newUser.password) {
        setError("Username dan password harus diisi");
        return;
      }

      const res = await api("tambahUser", "POST", newUser);
      if (res && res.success) {
        const successMsg = `Anggota ${newUser.username} berhasil ditambahkan`;
        setSuccessMessage(successMsg);
        setShowTambahForm(false);
        setNewUser({ username: "", password: "", role: "anggota" });
        await loadAnggota();

        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        setError(res?.error || "Gagal menambahkan anggota");
      }
    } catch (err) {
      console.error("tambahUser error:", err);
      setError("Error saat menambahkan anggota");
    }
  };

  const filteredAnggota = anggota.filter((ang) =>
    ang.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Memuat data anggota...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4">

      <div className="relative z-10 container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
              Kelola Anggota
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Manajemen data anggota koperasi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="bg-slate-700/60 hover:bg-slate-600/60 text-white px-3 py-2 rounded-xl transition-colors border border-gray-200 text-sm"
            >
              ← Dashboard
            </Link>
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

        {/* Search dan Add Button */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Cari anggota..."
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSearchTerm("")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-xl transition-colors border border-slate-500 text-sm min-w-[60px]"
              >
                Clear
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowTambahForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors border border-green-500 text-sm font-medium"
          >
            + Tambah Anggota Baru
          </button>
        </div>

        {/* Info Pencarian */}
        {searchTerm && (
          <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl backdrop-blur-sm">
            <p className="text-blue-300 text-sm">
              Menampilkan {filteredAnggota.length} hasil pencarian untuk "
              {searchTerm}"
            </p>
          </div>
        )}

        {/* Tabel Anggota - Mobile Optimized */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-3 sm:px-4 py-3">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Daftar Anggota
            </h2>
            <p className="text-indigo-200 text-xs sm:text-sm">
              {filteredAnggota.length} anggota ditemukan
            </p>
          </div>

          <div className="overflow-hidden">
            {filteredAnggota.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 text-4xl mb-2">👥</div>
                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? "Tidak ada anggota yang cocok"
                    : "Tidak ada data anggota"}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {!searchTerm &&
                    "Tambahkan anggota baru dengan tombol di atas"}
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full min-w-0">
                  <thead className="bg-white sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Anggota
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Saldo
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAnggota.map((ang) => (
                      <tr
                        key={ang.anggota_id}
                        className="hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-2 sm:px-3 py-3">
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {ang.username}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                ID: {ang.anggota_id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <div className="space-y-1">
                            <div className="text-green-400 text-sm font-medium">
                              {formatCurrency(ang.saldo || 0)}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              {ang.hutang > 0 && (
                                <span className="text-xs text-red-400">
                                  Hutang: {formatCurrency(ang.hutang || 0)}
                                </span>
                              )}
                              {ang.shu > 0 && (
                                <span className="text-xs text-amber-400">
                                  SHU: {formatCurrency(ang.shu || 0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${(ang.saldo || 0) >= 0
                                ? "bg-green-900/50 text-green-300 border-green-500/30"
                                : "bg-red-900/50 text-red-300 border-red-500/30"
                                }`}
                            >
                              {(ang.saldo || 0) >= 0 ? "Aktif" : "Nonaktif"}
                            </span>
                            {ang.hutang > 0 && (
                              <span className="text-xs text-red-400">
                                Ada Hutang
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Footer */}
          {anggota.length > 0 && (
            <div className="p-3 bg-slate-700/20 border-t border-gray-200">
              <p className="text-gray-500 text-xs text-center">
                Total {filteredAnggota.length} dari {anggota.length} anggota
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Anggota */}
      {showTambahForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-xl text-gray-900">
            <h2 className="text-lg font-bold text-gray-900">
              Tambah Anggota Baru
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-gray-600 text-sm mb-1 block">
                  Username *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="Masukkan username"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm mb-1 block">
                  Password *
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="Masukkan password"
                />
              </div>

              <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <p className="text-blue-300 text-xs">
                  💡 <strong>Info:</strong> Role akan otomatis diatur sebagai
                  "anggota". Saldo awal akan diatur ke 0.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors border border-slate-500 text-sm"
                onClick={() => setShowTambahForm(false)}
              >
                Batal
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors border border-green-500 text-sm"
                onClick={tambahUser}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
