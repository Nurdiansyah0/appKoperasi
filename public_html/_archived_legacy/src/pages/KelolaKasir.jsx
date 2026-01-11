// src/pages/KelolaKasir.jsx - UI/UX SAMA PERSIS DENGAN KASIR.JSX
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function KelolaKasir() {
  const [kasir, setKasir] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTambahForm, setShowTambahForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "kasir",
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

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

  const loadKasir = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api("getDataKasir", "GET");
      if (res && res.success) {
        setKasir(res.data);
      } else {
        throw new Error(res?.error || "Gagal memuat data kasir");
      }
    } catch (err) {
      console.error("Error loading kasir:", err);
      setError(err.message || "Gagal memuat data kasir");
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    loadKasir();
  }, []);

  const tambahKasir = async () => {
    try {
      if (!newUser.username || !newUser.password) {
        setError("Username dan password harus diisi");
        return;
      }

      const res = await api("tambahUser", "POST", newUser);
      if (res && res.success) {
        const successMsg = `Kasir ${newUser.username} berhasil ditambahkan`;
        setSuccessMessage(successMsg);
        setShowTambahForm(false);
        setNewUser({ username: "", password: "", role: "kasir" });
        await loadKasir();

        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        setError(res?.error || "Gagal menambahkan kasir");
      }
    } catch (err) {
      console.error("tambahKasir error:", err);
      setError("Error saat menambahkan kasir");
    }
  };

  const filteredKasir = kasir.filter((k) =>
    k.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Memuat data kasir...</p>
        </div>
      </div>
    );
  }

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
              Kelola Kasir
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Manajemen data kasir koperasi
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
              placeholder="Cari kasir..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800/60 text-white border border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSearchTerm("")}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-xl transition-colors border border-slate-500 text-sm min-w-[60px]"
              >
                Clear
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowTambahForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors border border-green-500 text-sm font-medium"
          >
            + Tambah Kasir Baru
          </button>
        </div>

        {/* Info Pencarian */}
        {searchTerm && (
          <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl backdrop-blur-sm">
            <p className="text-blue-300 text-sm">
              Menampilkan {filteredKasir.length} hasil pencarian untuk "
              {searchTerm}"
            </p>
          </div>
        )}

        {/* Tabel Kasir - Mobile Optimized */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 sm:px-4 py-3">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Daftar Kasir
            </h2>
            <p className="text-purple-200 text-xs sm:text-sm">
              {filteredKasir.length} kasir ditemukan
            </p>
          </div>

          <div className="overflow-hidden">
            {filteredKasir.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 text-4xl mb-2">👨‍💼</div>
                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? "Tidak ada kasir yang cocok"
                    : "Tidak ada data kasir"}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {!searchTerm && "Tambahkan kasir baru dengan tombol di atas"}
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full min-w-0">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Kasir
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {filteredKasir.map((k) => (
                      <tr
                        key={k.user_id}
                        className="hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-2 sm:px-3 py-3">
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {k.username}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs text-gray-500">
                                User ID: {k.user_id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30">
                            {k.role || "kasir"}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <span className="text-gray-500 text-sm font-mono">
                            #{k.user_id}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Footer */}
          {kasir.length > 0 && (
            <div className="p-3 bg-slate-700/20 border-t border-gray-200">
              <p className="text-gray-500 text-xs text-center">
                Total {filteredKasir.length} dari {kasir.length} kasir
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Kasir */}
      {showTambahForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="bg-gradient-to-tr from-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-slate-700/40 rounded-2xl w-full max-w-sm p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Tambah Kasir Baru</h2>

            <div className="space-y-3">
              <div>
                <label className="text-gray-600 text-sm mb-1 block">
                  Username *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="Masukkan password"
                />
              </div>

              <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                <p className="text-purple-300 text-xs">
                  💡 <strong>Info:</strong> Role akan otomatis diatur sebagai
                  "kasir". Kasir dapat mengakses dashboard kasir dan melakukan
                  transaksi.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white transition-colors border border-slate-500 text-sm"
                onClick={() => setShowTambahForm(false)}
              >
                Batal
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors border border-green-500 text-sm"
                onClick={tambahKasir}
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
