// src/pages/kasir/ReviewOpname.jsx - UI/UX IMPROVED
import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function ReviewOpname() {
  const navigate = useNavigate();
  const [serahTerimaList, setSerahTerimaList] = useState([]);
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Format waktu
  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Clear messages
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Load daftar serah terima yang ditujukan ke kasir ini
  useEffect(() => {
    const loadSerahTerima = async () => {
      try {
        setError("");
        const res = await api("getSerahTerimaForMe", "GET");

        if (res?.success) {
          setSerahTerimaList(res.data || []);
        } else {
          setError(res?.error || "Gagal memuat data");
        }
      } catch (err) {
        setError("Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
        setLastUpdate(new Date());
      }
    };
    loadSerahTerima();
  }, []);

  // Approve opname
  const approveOpname = async (serahId) => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api("approveSerahTerima", "POST", {
        serah_id: serahId,
      });

      if (res?.success) {
        setSuccess("Opname berhasil disetujui!");
        // Refresh list
        const updatedList = await api("getSerahTerimaForMe", "GET");
        if (updatedList?.success) {
          setSerahTerimaList(updatedList.data || []);
        }
        setSelectedOpname(null);
      } else {
        throw new Error(res?.error || "Gagal approve opname");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject opname
  const rejectOpname = async (serahId) => {
    if (!rejectReason.trim()) {
      setError("Harap berikan alasan penolakan");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api("rejectSerahTerima", "POST", {
        serah_id: serahId,
        alasan: rejectReason,
      });

      if (res?.success) {
        setSuccess(
          "Opname ditolak. Kasir pengirim diminta untuk opname ulang."
        );
        // Refresh list
        const updatedList = await api("getSerahTerimaForMe", "GET");
        if (updatedList?.success) {
          setSerahTerimaList(updatedList.data || []);
        }
        setSelectedOpname(null);
        setShowRejectModal(false);
        setRejectReason("");
      } else {
        throw new Error(res?.error || "Gagal reject opname");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open reject modal
  const openRejectModal = () => {
    setShowRejectModal(true);
    setRejectReason("");
  };

  // Close reject modal
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason("");
    setError("");
  };

  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-900/50 text-amber-300 border-amber-500/30";
      case "approved":
        return "bg-emerald-900/50 text-emerald-300 border-emerald-500/30";
      case "rejected":
        return "bg-red-900/50 text-red-300 border-red-500/30";
      default:
        return "bg-slate-900/50 text-gray-600 border-slate-500/30";
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Menunggu";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Memuat data opname...</p>
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
              Review Opname Stok
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Tinjau dan verifikasi hasil opname dari kasir lain
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
              🔄 {formatTime(lastUpdate)}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-slate-700/60 text-gray-600 rounded-xl hover:bg-slate-600/60 transition-colors border border-gray-200 text-sm"
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

        {/* Info Panel */}
        <div className="bg-gradient-to-tr from-blue-900/50 to-blue-800/40 backdrop-blur-lg border border-blue-500/30 text-blue-200 px-3 py-2 sm:px-4 sm:py-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-1 sm:p-2 bg-blue-500/20 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-sm">
              <strong>Petunjuk:</strong> Tinjau hasil opname dari kasir lain.
              Setujui jika data sudah benar, atau tolak untuk meminta opname
              ulang dengan memberikan alasan yang jelas.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Daftar Opname */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Daftar Opname
                </h2>
                <p className="text-indigo-200 text-xs sm:text-sm">
                  {serahTerimaList.length} opname diterima
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {serahTerimaList.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-lg font-medium mb-2">Tidak ada opname</p>
                    <p className="text-sm">
                      Belum ada opname stok yang dikirimkan kepada Anda
                    </p>
                  </div>
                ) : (
                  serahTerimaList.map((item) => (
                    <div
                      key={item.serah_id}
                      className={`p-3 sm:p-4 border-b border-gray-200 cursor-pointer transition-all ${
                        selectedOpname?.serah_id === item.serah_id
                          ? "bg-indigo-500/20 border-l-4 border-l-indigo-400"
                          : "hover:bg-slate-700/20"
                      }`}
                      onClick={() => setSelectedOpname(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm sm:text-base">
                            {item.kasir_from_name || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.created_at
                              ? formatDate(item.created_at)
                              : "Tanggal tidak tersedia"}
                          </div>
                          {item.summary && (
                            <div className="text-xs text-slate-500 mt-1">
                              {item.summary.totalBarang} barang •{" "}
                              {item.summary.barangSelisih || 0} selisih
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detail Opname */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Detail Opname
                </h2>
                {selectedOpname && (
                  <p className="text-purple-200 text-xs sm:text-sm">
                    dari {selectedOpname.kasir_from_name} •{" "}
                    {selectedOpname.created_at
                      ? new Date(selectedOpname.created_at).toLocaleDateString(
                          "id-ID"
                        )
                      : ""}
                  </p>
                )}
              </div>

              <div className="p-3 sm:p-4 max-h-96 overflow-y-auto">
                {!selectedOpname ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-4xl mb-4">👆</div>
                    <p className="text-lg font-medium">Pilih opname</p>
                    <p className="text-sm mt-1">
                      Pilih salah satu opname dari daftar untuk melihat detail
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary Cards */}
                    {selectedOpname.summary && (
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center">
                          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                            {selectedOpname.summary.totalBarang || 0}
                          </div>
                          <div className="text-gray-500 text-sm">
                            Total Barang
                          </div>
                        </div>
                        <div
                          className={`bg-gradient-to-tr backdrop-blur-lg border rounded-2xl p-4 text-center ${
                            (selectedOpname.summary.barangSelisih || 0) > 0
                              ? "from-red-900/50 to-red-800/40 border-red-500/30"
                              : "from-emerald-900/50 to-emerald-800/40 border-emerald-500/30"
                          }`}
                        >
                          <div
                            className={`text-2xl sm:text-3xl font-bold mb-1 ${
                              (selectedOpname.summary.barangSelisih || 0) > 0
                                ? "text-red-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {selectedOpname.summary.barangSelisih || 0}
                          </div>
                          <div
                            className={
                              (selectedOpname.summary.barangSelisih || 0) > 0
                                ? "text-red-300"
                                : "text-emerald-300"
                            }
                          >
                            Barang Selisih
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tabel Detail */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-600 mb-3 text-sm sm:text-base">
                        Detail Barang:
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Barang
                              </th>
                              <th className="p-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Stok Sistem
                              </th>
                              <th className="p-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Stok Input
                              </th>
                              <th className="p-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Selisih
                              </th>
                              <th className="p-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedOpname.items &&
                            selectedOpname.items.length > 0 ? (
                              selectedOpname.items.map((item) => (
                                <tr
                                  key={item.barang_id}
                                  className="hover:bg-slate-700/20 transition-colors"
                                >
                                  <td className="p-3 font-medium text-white text-xs sm:text-sm">
                                    {item.nama_barang}
                                  </td>
                                  <td className="p-3 text-right text-gray-600">
                                    {item.stok_aktual}
                                  </td>
                                  <td className="p-3 text-right text-gray-600">
                                    {item.stok_input}
                                  </td>
                                  <td
                                    className={`p-3 text-right font-medium ${
                                      item.selisih === 0
                                        ? "text-gray-600"
                                        : item.selisih > 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {item.selisih > 0 ? "+" : ""}
                                    {item.selisih}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                                        item.status === "sesuai"
                                          ? "bg-emerald-900/50 text-emerald-300 border-emerald-500/30"
                                          : "bg-red-900/50 text-red-300 border-red-500/30"
                                      }`}
                                    >
                                      {item.status === "sesuai"
                                        ? "✓ Sesuai"
                                        : "Selisih"}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="5"
                                  className="p-4 text-center text-gray-500"
                                >
                                  Tidak ada data barang
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedOpname.status === "pending" && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() =>
                              approveOpname(selectedOpname.serah_id)
                            }
                            disabled={actionLoading}
                            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 px-4 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 text-sm sm:text-base border border-emerald-500"
                          >
                            {actionLoading ? (
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
                                  className="h-4 w-4 sm:h-5 sm:w-5"
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
                                Setujui Opname
                              </>
                            )}
                          </button>
                          <button
                            onClick={openRejectModal}
                            disabled={actionLoading}
                            className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 px-4 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 text-sm sm:text-base border border-red-500"
                          >
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Tolak & Minta Ulang
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-center">
                          Setujui jika data sudah benar, atau tolak untuk minta
                          opname ulang
                        </p>
                      </div>
                    )}

                    {selectedOpname.status === "approved" && (
                      <div className="mt-4 p-4 bg-emerald-900/50 border border-emerald-500/30 rounded-xl text-center">
                        <div className="text-emerald-300 font-medium flex items-center justify-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
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
                          Opname telah disetujui
                        </div>
                      </div>
                    )}

                    {selectedOpname.status === "rejected" && (
                      <div className="mt-4 p-4 bg-red-900/50 border border-red-500/30 rounded-xl text-center">
                        <div className="text-red-300 font-medium flex items-center justify-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Opname telah ditolak
                        </div>
                        {selectedOpname.alasan_penolakan && (
                          <div className="text-red-400 text-sm mt-2">
                            <strong>Alasan:</strong>{" "}
                            {selectedOpname.alasan_penolakan}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-200 rounded-2xl shadow-xl max-w-md w-full backdrop-blur-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Tolak Opname
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Berikan alasan penolakan. Kasir pengirim akan diminta untuk
                melakukan opname ulang.
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Ada ketidaksesuaian pada stok beberapa barang, mohon dihitung ulang..."
                className="w-full h-32 p-3 bg-slate-900/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-slate-200 placeholder-slate-500"
                maxLength={500}
              />
              <div className="text-xs text-slate-500 text-right mt-1">
                {rejectReason.length}/500 karakter
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeRejectModal}
                  disabled={actionLoading}
                  className="flex-1 bg-slate-700/60 text-gray-600 py-2 px-4 rounded-xl hover:bg-slate-600/60 disabled:opacity-50 transition-colors border border-gray-200"
                >
                  Batal
                </button>
                <button
                  onClick={() => rejectOpname(selectedOpname.serah_id)}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-2 px-4 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 border border-red-500"
                >
                  {actionLoading ? (
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Tolak Opname
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
