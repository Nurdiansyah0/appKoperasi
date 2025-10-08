// src/pages/Stock.jsx - OPTIMIZED FOR 360x800
import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function Stok() {
  const [allData, setAllData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    nama_barang: "",
    stok: 0,
    harga_modal: 0,
    harga_jual: 0,
  });

  const normalize = (r) => ({
    id: r.barang_id ?? r.id ?? r.ID ?? r.brg_id ?? null,
    nama_item: r.nama_item ?? r.nama_barang ?? r.nama ?? r.name ?? "",
    stok_item: Number(r.stok_item ?? r.stok ?? r.stock ?? 0),
    hp_item: Number(r.harga_modal ?? r.hp_item ?? r.cost ?? r.hp ?? 0),
    harga_jual: Number(r.harga_jual ?? r.price ?? r.harga ?? 0),
    raw: r,
  });

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api("getDataBarang", "GET");
      if (!res) throw new Error("No response from server");
      if (res.success) {
        const arr = Array.isArray(res.data) ? res.data.map(normalize) : [];
        setAllData(arr);
        setDisplayedData(arr.slice(0, 10));
      } else {
        throw new Error(res.error || "Gagal memuat data barang");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Gagal memuat data stok barang");
      setAllData([]);
      setDisplayedData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setDisplayedData(allData.slice(0, 10));
      return;
    }

    const query = searchTerm.toLowerCase().trim();
    const filtered = allData.filter((item) =>
      (item.nama_item ?? "").toLowerCase().includes(query)
    );

    setDisplayedData(filtered.slice(0, 10));
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDisplayedData(allData.slice(0, 10));
  };

  useEffect(() => {
    if (allData.length > 0) {
      handleSearch();
    }
  }, [searchTerm, allData]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const compareBy = (a, b, key) => {
    const va = a?.[key];
    const vb = b?.[key];
    const na = typeof va === "string" ? va.toLowerCase() : va ?? 0;
    const nb = typeof vb === "string" ? vb.toLowerCase() : vb ?? 0;

    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
  };

  const sortedData = [...displayedData];
  if (sortConfig.key) {
    sortedData.sort((a, b) => {
      const cmp = compareBy(a, b, sortConfig.key);
      return sortConfig.direction === "ascending" ? cmp : -cmp;
    });
  }

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const tambahBarang = async () => {
    try {
      if (!newItem.nama_barang.trim()) {
        alert("Nama barang harus diisi");
        return;
      }
      if (newItem.harga_jual <= 0 || newItem.harga_modal <= 0) {
        alert("Harga harus lebih dari 0");
        return;
      }

      const res = await api("tambahBarang", "POST", newItem);
      if (res && res.success) {
        alert("Barang berhasil ditambahkan");
        setShowAddForm(false);
        setNewItem({ nama_barang: "", stok: 0, harga_modal: 0, harga_jual: 0 });
        await loadData();
      } else {
        alert(res?.error || "Gagal menambahkan barang");
      }
    } catch (err) {
      console.error("tambahBarang error:", err);
      alert("Error saat menambahkan barang");
    }
  };

  const saveEditItem = async (item) => {
    try {
      const payload = {
        barang_id: item.id,
        nama_barang: item.nama_item,
        stok: Number(item.stok_item || 0),
        harga_modal: Number(item.hp_item || 0),
        harga_jual: Number(item.harga_jual || 0),
      };

      const res = await api("updateBarang", "POST", payload);
      if (res && res.success) {
        alert("Perubahan berhasil disimpan");
        setEditingItem(null);
        await loadData();
      } else {
        alert(res?.error || "Gagal menyimpan perubahan");
      }
    } catch (err) {
      console.error("saveEditItem error:", err);
      alert("Error saat menyimpan perubahan");
    }
  };

  const hapusBarang = async (id, nama) => {
    if (
      !confirm(
        `Yakin ingin menghapus barang "${nama}"?\n\nPERHATIAN: Barang tidak dapat dihapus jika sudah pernah digunakan dalam transaksi.`
      )
    )
      return;

    try {
      const res = await api("hapusBarang", "POST", { barang_id: id });
      if (res && res.success) {
        alert("Barang berhasil dihapus");
        await loadData();
      } else {
        if (
          res?.error?.includes("foreign key constraint") ||
          res?.error?.includes("transaksi_detail")
        ) {
          alert(
            `Tidak dapat menghapus barang "${nama}" karena sudah pernah digunakan dalam transaksi. \n\nSolusi: Ubah status barang menjadi tidak aktif atau edit stok menjadi 0.`
          );
        } else {
          alert(res?.error || "Gagal menghapus barang");
        }
      }
    } catch (err) {
      console.error("hapusBarang error:", err);
      if (
        err.message?.includes("foreign key constraint") ||
        err.message?.includes("transaksi_detail")
      ) {
        alert(
          `Tidak dapat menghapus barang "${nama}" karena sudah pernah digunakan dalam transaksi. \n\nSolusi: Ubah status barang menjadi tidak aktif atau edit stok menjadi 0.`
        );
      } else {
        alert("Error saat menghapus barang");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat data stok...</p>
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
              Kelola Stok Barang
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Manajemen stok dan harga barang koperasi
            </p>
          </div>
        </div>

        {/* Search dan Add Button */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Cari barang..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800/60 text-white border border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl transition-colors border border-blue-500 text-sm min-w-[60px]"
              >
                Cari
              </button>
              <button
                onClick={clearSearch}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-xl transition-colors border border-slate-500 text-sm min-w-[60px]"
              >
                Clear
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors border border-green-500 text-sm font-medium"
          >
            + Tambah Barang Baru
          </button>
        </div>

        {/* Info Pencarian */}
        {searchTerm && (
          <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl backdrop-blur-sm">
            <p className="text-blue-300 text-sm">
              Menampilkan {sortedData.length} hasil pencarian untuk "
              {searchTerm}"
            </p>
          </div>
        )}

        {!searchTerm && allData.length > 10 && (
          <div className="p-3 bg-slate-700/20 border border-slate-600/30 rounded-xl backdrop-blur-sm">
            <p className="text-slate-300 text-sm">
              Menampilkan 10 dari {allData.length} barang. Gunakan search bar
              untuk mencari barang tertentu.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-xl backdrop-blur-sm">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Tabel Stok - Mobile Optimized */}
        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Daftar Barang
            </h2>
          </div>

          <div className="overflow-hidden">
            {sortedData.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 text-4xl mb-2">📦</div>
                <p className="text-slate-400 text-sm">
                  {searchTerm
                    ? "Tidak ada barang yang cocok"
                    : "Tidak ada data barang"}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {!searchTerm && "Tambahkan barang baru dengan tombol di atas"}
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full min-w-0">
                  <thead className="bg-slate-700/40 sticky top-0">
                    <tr>
                      <th
                        className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("nama_item")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Nama Barang</span>
                          <span className="text-xs">
                            {getSortIndicator("nama_item")}
                          </span>
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("stok_item")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Stok</span>
                          <span className="text-xs">
                            {getSortIndicator("stok_item")}
                          </span>
                        </div>
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {sortedData.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-2 sm:px-3 py-3">
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {item.nama_item}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs text-slate-400">
                                HPP: {formatCurrency(item.hp_item)}
                              </span>
                              <span className="text-xs text-green-400 font-medium">
                                Jual: {formatCurrency(item.harga_jual)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                              item.stok_item > 20
                                ? "bg-green-900/50 text-green-300 border-green-500/30"
                                : item.stok_item > 0
                                ? "bg-yellow-900/50 text-yellow-300 border-yellow-500/30"
                                : "bg-red-900/50 text-red-300 border-red-500/30"
                            }`}
                          >
                            {item.stok_item}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg transition-colors border border-indigo-500"
                              title="Edit"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                hapusBarang(item.id, item.nama_item)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg transition-colors border border-red-500"
                              title="Hapus"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Footer */}
          {allData.length > 10 && (
            <div className="p-3 bg-slate-700/20 border-t border-slate-600/40">
              <p className="text-slate-400 text-xs text-center">
                Menampilkan {sortedData.length} dari {allData.length} barang
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Barang */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="bg-gradient-to-tr from-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-slate-700/40 rounded-2xl w-full max-w-sm p-4 space-y-4">
            <h2 className="text-lg font-bold text-white">Tambah Barang Baru</h2>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 text-sm mb-1 block">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newItem.nama_barang}
                  onChange={(e) =>
                    setNewItem({ ...newItem, nama_barang: e.target.value })
                  }
                  placeholder="Masukkan nama barang"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-1 block">
                  Stok Awal
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newItem.stok}
                  onChange={(e) =>
                    setNewItem({ ...newItem, stok: Number(e.target.value) })
                  }
                  min="0"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-1 block">
                  Harga Pokok *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newItem.harga_modal}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      harga_modal: Number(e.target.value),
                    })
                  }
                  min="0"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-1 block">
                  Harga Jual *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newItem.harga_jual}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      harga_jual: Number(e.target.value),
                    })
                  }
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white transition-colors border border-slate-500 text-sm"
                onClick={() => setShowAddForm(false)}
              >
                Batal
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors border border-green-500 text-sm"
                onClick={tambahBarang}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Barang */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="bg-gradient-to-tr from-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-slate-700/40 rounded-2xl w-full max-w-sm p-4 space-y-4">
            <h2 className="text-lg font-bold text-white">Edit Barang</h2>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 text-sm mb-1 block">
                  Nama Barang
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={editingItem.nama_item}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      nama_item: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-1 block">
                  Stok
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={editingItem.stok_item}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      stok_item: Number(e.target.value),
                    })
                  }
                  min="0"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-1 block">
                  Harga Pokok
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={editingItem.hp_item}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      hp_item: Number(e.target.value),
                    })
                  }
                  min="0"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-1 block">
                  Harga Jual
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={editingItem.harga_jual}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      harga_jual: Number(e.target.value),
                    })
                  }
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white transition-colors border border-slate-500 text-sm"
                onClick={() => setEditingItem(null)}
              >
                Batal
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors border border-green-500 text-sm"
                onClick={() => saveEditItem(editingItem)}
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
