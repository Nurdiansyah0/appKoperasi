import React, { useState, useEffect, useRef } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";

const KasirPembayaranHutang = () => {
  const navigate = useNavigate();
  const [pembayaranList, setPembayaranList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("pending");

  // Format waktu
  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Clear messages
  const clearMessages = () => {
    setError(null);
    setSuccess("");
  };

  // Fetch semua pembayaran hutang
  const fetchPembayaranHutang = async () => {
    setLoading(true);
    try {
      const res = await api("getAllPembayaranHutang", "GET");
      if (res?.success) {
        setPembayaranList(res.data || []);
      } else {
        setError(res?.message || "Gagal memuat data pembayaran");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchPembayaranHutang();
  }, []);

  // Handle approve/reject
  const handleApproveReject = async (pembayaranId, action) => {
    const actionText = action === "approve" ? "menyetujui" : "menolak";

    setProcessing((prev) => ({ ...prev, [pembayaranId]: true }));
    setError(null);
    setSuccess("");

    try {
      const res = await api("approvePembayaranHutang", "POST", {
        pembayaran_id: pembayaranId,
        action: action,
      });

      if (res?.success) {
        setSuccess(
          `Pembayaran berhasil ${
            action === "approve" ? "disetujui" : "ditolak"
          }`
        );
        fetchPembayaranHutang();

        // Otomatis switch ke tab history jika tidak ada pending lagi
        if (action === "approve" && pendingPayments.length <= 1) {
          setActiveTab("history");
        }
      } else {
        setError(res?.message || `Gagal ${action} pembayaran`);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Terjadi kesalahan server");
    } finally {
      setProcessing((prev) => ({ ...prev, [pembayaranId]: false }));
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Filter berdasarkan status yang benar
  const pendingPayments = pembayaranList.filter((p) => p.status === "pending");
  const approvedPayments = pembayaranList.filter(
    (p) => p.status === "approved"
  );
  const rejectedPayments = pembayaranList.filter(
    (p) => p.status === "rejected"
  );
  const completedPayments = pembayaranList.filter(
    (p) => p.status !== "pending"
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  if (error && !pembayaranList.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="relative z-10 text-center max-w-md p-6 bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-300 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Refresh Halaman
          </button>
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
              Kelola Pembayaran Hutang
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Kelola permintaan pembayaran hutang dari anggota
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {pembayaranList.length}
            </div>
            <div className="text-slate-400 text-sm">Total Pembayaran</div>
          </div>
          <div className="bg-gradient-to-tr from-yellow-900/50 to-yellow-800/40 backdrop-blur-lg border border-yellow-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">
              {pendingPayments.length}
            </div>
            <div className="text-yellow-300 text-sm">Pending</div>
          </div>
          <div className="bg-gradient-to-tr from-emerald-900/50 to-emerald-800/40 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1">
              {approvedPayments.length}
            </div>
            <div className="text-emerald-300 text-sm">Approved</div>
          </div>
          <div className="bg-gradient-to-tr from-red-900/50 to-red-800/40 backdrop-blur-lg border border-red-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">
              {rejectedPayments.length}
            </div>
            <div className="text-red-300 text-sm">Rejected</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "pending"
                  ? "bg-yellow-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              Pending
              <span className="ml-2 bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">
                {pendingPayments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "approved"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              Approved
              <span className="ml-2 bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full text-xs">
                {approvedPayments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "rejected"
                  ? "bg-red-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              Rejected
              <span className="ml-2 bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">
                {rejectedPayments.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Pending Payments */}
          {activeTab === "pending" && (
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-4 sm:px-6 py-3 sm:py-4">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Pembayaran Pending
                </h2>
                <p className="text-yellow-200 text-xs sm:text-sm">
                  {pendingPayments.length} pembayaran menunggu persetujuan
                </p>
              </div>

              <div className="p-3 sm:p-4">
                {pendingPayments.length > 0 ? (
                  <div className="space-y-3">
                    {pendingPayments.map((item) => (
                      <div
                        key={item.pembayaran_id}
                        className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 sm:p-4 backdrop-blur-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium text-white text-sm">
                                #{item.pembayaran_id}
                              </span>
                              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium border border-yellow-500/30">
                                PENDING
                              </span>
                            </div>
                            <div className="text-sm text-slate-300 space-y-1">
                              <p className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-slate-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                Anggota:{" "}
                                <span className="text-white font-medium">
                                  {item.nama_anggota ||
                                    `ID: ${item.anggota_id}`}
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-slate-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Tanggal: {formatDate(item.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg sm:text-xl font-bold text-emerald-400">
                              {formatCurrency(item.nominal)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-yellow-500/20">
                          <button
                            onClick={() =>
                              handleApproveReject(item.pembayaran_id, "approve")
                            }
                            disabled={processing[item.pembayaran_id]}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-xl font-medium transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 border border-emerald-500"
                          >
                            {processing[item.pembayaran_id] ? (
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
                                Memproses...
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleApproveReject(item.pembayaran_id, "reject")
                            }
                            disabled={processing[item.pembayaran_id]}
                            className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl font-medium transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 border border-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm">Tidak ada pembayaran yang pending</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approved Payments */}
          {activeTab === "approved" && (
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-3 sm:py-4">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Pembayaran Approved
                </h2>
                <p className="text-emerald-200 text-xs sm:text-sm">
                  {approvedPayments.length} pembayaran telah disetujui
                </p>
              </div>

              <PaymentHistoryTable
                payments={approvedPayments}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            </div>
          )}

          {/* Rejected Payments */}
          {activeTab === "rejected" && (
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-3 sm:py-4">
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
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Pembayaran Rejected
                </h2>
                <p className="text-red-200 text-xs sm:text-sm">
                  {rejectedPayments.length} pembayaran telah ditolak
                </p>
              </div>

              <PaymentHistoryTable
                payments={rejectedPayments}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Komponen terpisah untuk tabel riwayat
const PaymentHistoryTable = ({ payments, formatCurrency, formatDate }) => {
  return (
    <div className="p-3 sm:p-4">
      {payments.length > 0 ? (
        <div className="overflow-hidden">
          <div className="min-w-0">
            <div className="hidden sm:block">
              <table className="w-full">
                <thead className="bg-slate-700/40">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Anggota
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Nominal
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Kasir
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/40">
                  {payments.map((item) => (
                    <tr
                      key={item.pembayaran_id}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          #{item.pembayaran_id}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {item.nama_anggota || `Anggota ${item.anggota_id}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {item.anggota_id}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-emerald-400">
                          {formatCurrency(item.nominal)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-300">
                          {formatDate(
                            item.approved_at ||
                              item.updated_at ||
                              item.created_at
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        {item.nama_kasir ? (
                          <div>
                            <div className="text-sm font-medium text-white">
                              {item.nama_kasir}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID: {item.kasir_id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {payments.map((item) => (
                <div
                  key={item.pembayaran_id}
                  className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/40"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">
                        #{item.pembayaran_id} •{" "}
                        {item.nama_anggota || `Anggota ${item.anggota_id}`}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {formatDate(
                          item.approved_at || item.updated_at || item.created_at
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(item.nominal)}
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      {item.nama_kasir ? `Kasir: ${item.nama_kasir}` : "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2">
            {payments === approvedPayments ? "✅" : "❌"}
          </div>
          <p className="text-sm">
            {payments === approvedPayments
              ? "Belum ada pembayaran yang approved"
              : "Belum ada pembayaran yang rejected"}
          </p>
        </div>
      )}
    </div>
  );
};

// Fix untuk reference
const approvedPayments = [];
const rejectedPayments = [];

export default KasirPembayaranHutang;
