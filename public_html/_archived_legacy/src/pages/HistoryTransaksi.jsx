// src/pages/HistoryTransaksi.jsx - Shopee-Style Transaction History
import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function HistoryTransaksi({ user }) {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    tanggal_awal: "",
    tanggal_akhir: "",
    jenis_transaksi: "",
    status: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    loadHistoryTransaksi();
  }, []);

  const loadHistoryTransaksi = async (filters = {}) => {
    try {
      setLoading(true);

      const params = {};
      if (filters.tanggal_awal) params.tanggal_awal = filters.tanggal_awal;
      if (filters.tanggal_akhir) params.tanggal_akhir = filters.tanggal_akhir;
      if (filters.jenis_transaksi) params.jenis_transaksi = filters.jenis_transaksi;
      if (filters.status) params.status = filters.status;

      const res = await api("getHistoryTransaksi", "GET", null, params);

      if (res && res.success) {
        setTransaksi(res.data || []);
      } else {
        setTransaksi([]);
      }
    } catch (error) {
      console.error("Error loading transaksi:", error);
      setTransaksi([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    const filterParams = {};
    if (filter.tanggal_awal) filterParams.tanggal_awal = filter.tanggal_awal;
    if (filter.tanggal_akhir) filterParams.tanggal_akhir = filter.tanggal_akhir;
    if (filter.jenis_transaksi) filterParams.jenis_transaksi = filter.jenis_transaksi;
    if (filter.status) filterParams.status = filter.status;

    await loadHistoryTransaksi(filterParams);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setFilter({
      tanggal_awal: "",
      tanggal_akhir: "",
      jenis_transaksi: "",
      status: ""
    });
    loadHistoryTransaksi();
    setCurrentPage(1);
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '-';
    try {
      return new Date(tanggal).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  const handleShowProducts = (transaction) => {
    setSelectedTransaction(transaction);
    setShowProductModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'selesai': 'bg-green-100 text-green-700',
      'pending': 'bg-amber-100 text-amber-700',
      'on_process': 'bg-blue-100 text-blue-700',
      'dibatalkan': 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusConfig[status] || 'bg-gray-100 text-gray-700'}`}>
        {status || 'UNKNOWN'}
      </span>
    );
  };

  const getMetodeBadge = (metode) => {
    const badgeConfig = {
      'cash': 'bg-emerald-100 text-emerald-700',
      'transfer': 'bg-blue-100 text-blue-700',
      'ewallet': 'bg-purple-100 text-purple-700',
      'qr': 'bg-indigo-100 text-indigo-700',
      'qris': 'bg-indigo-100 text-indigo-700',
      'hutang': 'bg-rose-100 text-rose-700'
    };

    const labels = {
      'cash': '💵 Cash',
      'transfer': '🏦 Transfer',
      'ewallet': '📱 E-Wallet',
      'qr': '📲 QR',
      'qris': '📲 QRIS',
      'hutang': '💳 Hutang'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeConfig[metode] || 'bg-gray-100 text-gray-700'}`}>
        {labels[metode] || metode}
      </span>
    );
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = transaksi.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transaksi.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section - Shopee Style */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔍</span>
          Filter Transaksi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Tanggal Awal
            </label>
            <input
              type="date"
              value={filter.tanggal_awal}
              onChange={(e) => setFilter({ ...filter, tanggal_awal: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Tanggal Akhir
            </label>
            <input
              type="date"
              value={filter.tanggal_akhir}
              onChange={(e) => setFilter({ ...filter, tanggal_akhir: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💳 Metode Pembayaran
            </label>
            <select
              value={filter.jenis_transaksi}
              onChange={(e) => setFilter({ ...filter, jenis_transaksi: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Semua</option>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="ewallet">E-Wallet</option>
              <option value="qris">QRIS</option>
              <option value="hutang">Hutang</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Semua</option>
              <option value="selesai">Selesai</option>
              <option value="pending">Pending</option>
              <option value="on_process">On Process</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleFilter}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            🔍 Terapkan Filter
          </button>
          <button
            onClick={handleResetFilter}
            className="bg-white text-gray-700 border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Transaksi</p>
            <p className="text-3xl font-bold mt-1">{transaksi.length}</p>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </div>

      {/* Transaction List */}
      {currentItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada transaksi</h3>
          <p className="text-gray-500">Tidak ada data transaksi yang ditemukan</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Anggota</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Metode</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kasir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((item, index) => (
                    <tr key={item.transaksi_id || `transaksi-${index}`} className="hover:bg-orange-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-orange-600">#{item.transaksi_id || item.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatTanggal(item.created_at || item.tanggal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.nama_anggota || 'Non-Anggota'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.items && Array.isArray(item.items) && item.items.length > 0 ? (
                          <div
                            className="max-w-xs cursor-pointer hover:text-orange-600 transition-colors"
                            onClick={() => handleShowProducts(item)}
                          >
                            {item.items.slice(0, 2).map((product, idx) => (
                              <div key={idx} className="text-xs">
                                • {product.nama_barang || product.nama_item} ({product.jumlah}x)
                              </div>
                            ))}
                            {item.items.length > 2 && (
                              <div className="text-xs text-orange-600 font-semibold hover:underline">+{item.items.length - 2} lainnya (klik detail)</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getMetodeBadge(item.metode_pembayaran || item.jenis_transaksi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatRupiah(item.total_harga || item.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.nama_kasir || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Shopee Style */}
          {totalPages > 1 && (
            <div className="bg-white rounded-2xl shadow-lg px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600 font-medium">
                  Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, transaksi.length)} dari {transaksi.length} transaksi
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-orange-500 transition-all font-semibold text-sm"
                  >
                    ← Previous
                  </button>

                  <div className="hidden sm:flex gap-2">
                    {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = index + 1;
                      } else if (currentPage <= 3) {
                        pageNum = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + index;
                      } else {
                        pageNum = currentPage - 2 + index;
                      }

                      return (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => paginate(pageNum)}
                          className={`px-4 py-2 border-2 rounded-lg font-semibold text-sm transition-all ${currentPage === pageNum
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-md'
                            : 'border-gray-300 hover:bg-gray-50 hover:border-orange-500'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-orange-500 transition-all font-semibold text-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Details Modal */}
      {showProductModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowProductModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Detail Produk - Transaksi #{selectedTransaction.id || selectedTransaction.transaksi_id}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-white hover:text-gray-200 transition-colors text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                <div className="space-y-3">
                  {selectedTransaction.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.nama_barang || item.nama_item}</p>
                        <p className="text-sm text-gray-600">
                          {formatRupiah(item.harga_satuan)} × {item.jumlah}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">
                          {formatRupiah(item.harga_satuan * item.jumlah)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="border-t-2 border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatRupiah(Number(selectedTransaction.total || selectedTransaction.total_harga))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Tidak ada detail produk</p>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}