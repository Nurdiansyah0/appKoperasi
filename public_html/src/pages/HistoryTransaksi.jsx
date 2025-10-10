// src/pages/HistoryTransaksi.jsx
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
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadHistoryTransaksi();
  }, []);

  const loadHistoryTransaksi = async (filters = {}) => {
    try {
      setLoading(true);
      
      console.log("Loading transaksi dengan filters:", filters);
      
      // Build parameters object untuk filter
      const params = {};
      
      // Hanya tambahkan parameter yang memiliki nilai
      if (filters.tanggal_awal) params.tanggal_awal = filters.tanggal_awal;
      if (filters.tanggal_akhir) params.tanggal_akhir = filters.tanggal_akhir;
      if (filters.jenis_transaksi) params.jenis_transaksi = filters.jenis_transaksi;
      if (filters.status) params.status = filters.status;
      
      console.log("Sending params to API:", params);
      
      // Gunakan fungsi api yang diperbaiki
      const res = await api("getHistoryTransaksi", "GET", null, params);
      
      if (res && res.success) {
        console.log("Data received:", res.data);
        setTransaksi(res.data || []);
      } else {
        console.error("API Error:", res);
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
    
    // Hanya tambahkan parameter yang memiliki nilai
    if (filter.tanggal_awal) filterParams.tanggal_awal = filter.tanggal_awal;
    if (filter.tanggal_akhir) filterParams.tanggal_akhir = filter.tanggal_akhir;
    if (filter.jenis_transaksi) filterParams.jenis_transaksi = filter.jenis_transaksi;
    if (filter.status) filterParams.status = filter.status;
    
    console.log("Filter parameters:", filterParams);
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

  // Function untuk test API langsung - berguna untuk debugging
  const testAPI = async () => {
    try {
      console.log("Testing API directly...");
      
      const result = await api("getHistoryTransaksi", "GET");
      console.log('Test API Result:', result);
      
    } catch (error) {
      console.error('Test API error:', error);
    }
  };

  // Format functions
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
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'selesai': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'on_process': 'bg-blue-100 text-blue-800',
      'dibatalkan': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const getMetodePembayaranLabel = (metode) => {
    const labels = {
      'cash': 'Cash',
      'transfer': 'Transfer',
      'ewallet': 'E-Wallet',
      'qris': 'QRIS',
      'hutang': 'Hutang'
    };
    return labels[metode] || metode;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = transaksi.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transaksi.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={`filter-skeleton-${i}`} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={`row-skeleton-${i}`} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">History Transaksi</h1>
          <p className="text-gray-600 mt-2">Riwayat semua transaksi yang telah dilakukan</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Transaksi</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={filter.tanggal_awal}
                onChange={(e) => setFilter({...filter, tanggal_awal: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={filter.tanggal_akhir}
                onChange={(e) => setFilter({...filter, tanggal_akhir: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={filter.jenis_transaksi}
                onChange={(e) => setFilter({...filter, jenis_transaksi: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua</option>
                <option value="selesai">Selesai</option>
                <option value="pending">Pending</option>
                <option value="on_process">On Process</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleFilter}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Terapkan Filter
            </button>
            <button
              onClick={handleResetFilter}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Transaksi ({transaksi.length} items)
            </h2>
          </div>

          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada transaksi</h3>
              <p className="text-gray-500">Tidak ada data transaksi yang ditemukan</p>
              <button 
                onClick={testAPI}
                className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4 text-sm"
              >
                Test API Connection
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID Transaksi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Anggota
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metode Bayar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kasir
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((item, index) => (
                      <tr 
                        key={item.transaksi_id || `transaksi-${index}`} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{item.transaksi_id || item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTanggal(item.created_at || item.tanggal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.nama_anggota || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getMetodePembayaranLabel(item.metode_pembayaran || item.jenis_transaksi)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatRupiah(item.total_harga || item.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.nama_kasir || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, transaksi.length)} dari {transaksi.length} transaksi
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={`page-${index + 1}`}
                          onClick={() => paginate(index + 1)}
                          className={`px-3 py-1 border rounded-md ${
                            currentPage === index + 1
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}