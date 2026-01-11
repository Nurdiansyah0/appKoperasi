// src/pages/Riwayat.jsx - Market Theme
import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";
import NavbarMarketplace from "../components/NavbarMarketplace";
import { useCart } from "../context/CartContext";

export default function Riwayat({ user }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMetode, setFilterMetode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistori = async () => {
    setLoading(true);
    setError(null);
    try {
      const histRes = await api("getHistoriTransaksi", "GET");

      if (histRes?.success && Array.isArray(histRes.data)) {
        setTransactions(histRes.data);
      } else {
        setTransactions([]);
        if (histRes && !histRes.success) {
          // Silent fail or minimal error
          console.warn(histRes);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat riwayat");
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchHistori();
  }, []);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "selesai":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">Selesai</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-200">Menunggu Konfirmasi</span>;
      case "ditolak":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">Dibatalkan</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Processed</span>;
    }
  };

  const getMetodeLabel = (metode) => {
    switch (metode) {
      case "cash": return "Tunai (Cash)";
      case "ewallet": return "Saldo Anggota";
      case "transfer": return "Transfer Bank";
      case "hutang": return "Hutang";
      default: return metode;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavbarMarketplace user={user} />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Riwayat Pesanan</h1>
            <p className="text-gray-500 text-sm mt-1">Lacak status pesanan dan riwayat belanja Anda</p>
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="selesai">Selesai</option>
              <option value="ditolak">Dibatalkan</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800">Belum ada pesanan</h3>
              <p className="text-gray-500 mt-1 mb-6">Yuk mulai belanja kebutuhanmu sekarang!</p>
              <button onClick={() => navigate('/belanja')} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                Mulai Belanja
              </button>
            </div>
          ) : (
            filteredTransactions.map((trx) => (
              <div key={trx.id_transaksi || trx.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header Trx */}
                <div className="px-6 py-4 border-b bg-gray-50/50 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{formatDate(trx.created_at || trx.tanggal_transaksi)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{trx.id_transaksi ? `TRX-${trx.id_transaksi}` : 'No ID'}</span>
                  </div>
                  {getStatusBadge(trx.status)}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Items */}
                    <div className="flex-1 space-y-4">
                      {trx.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            <img
                              src={`https://placehold.co/100x100/orange/white?text=${encodeURIComponent(item.nama_barang?.substring(0, 2) || 'PR')}`}
                              alt={item.nama_barang}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{item.nama_barang}</h4>
                            <p className="text-sm text-gray-500">{item.jumlah} x {formatCurrency(item.harga_satuan)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Sidebar in Card */}
                    <div className="md:w-64 flex-shrink-0 md:border-l pl-0 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Belanja</p>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency(trx.total_harga)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Metode Bayar</p>
                          <p className="text-sm font-medium text-gray-700 capitalize">{getMetodeLabel(trx.metode_pembayaran)}</p>
                        </div>

                        {(trx.status === 'selesai' || trx.status === 'success') && (
                          <button className="w-full py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium border border-orange-200 hover:bg-orange-100 transition-colors">
                            Beli Lagi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

