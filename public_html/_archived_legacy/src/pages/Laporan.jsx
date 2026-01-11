// src/pages/Laporan.jsx - UI/UX SAMA PERSIS DENGAN KASIR.JSX
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function Laporan() {
  const [laporanData, setLaporanData] = useState({
    transaksiHarian: [],
    totalPendapatan: 0,
    totalTransaksi: 0,
    breakdownPembayaran: {
      cash: 0,
      qr: 0,
      ewallet: 0,
      transfer: 0,
      hutang: 0,
    },
    breakdownKasir: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
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

  const loadLaporan = async () => {
  setIsLoading(true);
  setError("");
  try {
    const res = await api("getLaporanTransaksi", "POST", {
      tanggal_awal: tanggalAwal,
      tanggal_akhir: tanggalAkhir,
    });

    console.log("Laporan response:", res);

    if (res && res.success) {
      setLaporanData({
        transaksiHarian: res.transaksi_harian || [], // Perbaiki penamaan
        totalPendapatan: res.total_pendapatan || 0,
        totalTransaksi: res.total_transaksi || 0,
        breakdownPembayaran: res.breakdown_pembayaran || {
          cash: 0,
          qr: 0,
          ewallet: 0,
          transfer: 0,
          hutang: 0,
        },
        breakdownKasir: res.breakdown_kasir || [],
      });
      setSuccessMessage("Laporan berhasil dimuat");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } else {
      throw new Error(res?.error || "Gagal memuat data laporan");
    }
  } catch (err) {
    console.error("Error loading laporan:", err);
    setError(err.message || "Gagal memuat data laporan");
    
    // Set data kosong untuk menghindari error UI
    setLaporanData({
      transaksiHarian: [],
      totalPendapatan: 0,
      totalTransaksi: 0,
      breakdownPembayaran: {
        cash: 0,
        qr: 0,
        ewallet: 0,
        transfer: 0,
        hutang: 0,
      },
      breakdownKasir: [],
    });
  } finally {
    setIsLoading(false);
    setLastUpdate(new Date());
  }
};

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setTanggalAwal(firstDay.toISOString().split("T")[0]);
    setTanggalAkhir(lastDay.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (tanggalAwal && tanggalAkhir) {
      loadLaporan();
    }
  }, [tanggalAwal, tanggalAkhir]);

  const generateLaporan = async () => {
    if (!tanggalAwal || !tanggalAkhir) {
      setError("Pilih rentang tanggal terlebih dahulu");
      return;
    }
    await loadLaporan();
  };

  const exportToPDF = async () => {
    setExportLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("LAPORAN TRANSAKSI KOPERASI", 105, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Periode: ${new Date(tanggalAwal).toLocaleDateString(
          "id-ID"
        )} - ${new Date(tanggalAkhir).toLocaleDateString("id-ID")}`,
        105,
        22,
        { align: "center" }
      );
      doc.text(
        `Dibuat pada: ${new Date().toLocaleDateString(
          "id-ID"
        )} ${new Date().toLocaleTimeString("id-ID")}`,
        105,
        28,
        { align: "center" }
      );

      let yPosition = 40;

      // Summary
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("RINGKASAN UTAMA", 14, yPosition);
      yPosition += 10;

      const summaryData = [
        ["Total Transaksi", laporanData.totalTransaksi.toString()],
        ["Total Pendapatan", formatCurrency(laporanData.totalPendapatan)],
        [
          "Rata-rata Transaksi",
          formatCurrency(
            laporanData.totalTransaksi > 0
              ? laporanData.totalPendapatan / laporanData.totalTransaksi
              : 0
          ),
        ],
      ];

      doc.setFontSize(10);
      let currentY = yPosition;

      // Table header
      doc.setFillColor(59, 130, 246);
      doc.setTextColor(255, 255, 255);
      doc.rect(14, currentY, 182, 8, "F");
      doc.text("METRIK", 20, currentY + 6);
      doc.text("NILAI", 160, currentY + 6, { align: "right" });

      currentY += 8;

      // Table rows
      doc.setTextColor(0, 0, 0);
      summaryData.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? [240, 240, 240] : [255, 255, 255];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(14, currentY, 182, 8, "F");
        doc.text(row[0], 20, currentY + 6);
        doc.text(row[1], 190, currentY + 6, { align: "right" });
        currentY += 8;
      });

      yPosition = currentY + 15;

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i} dari ${pageCount}`, 105, 290, {
          align: "center",
        });
        doc.text("© Koperasi - Generated by System", 105, 293, {
          align: "center",
        });
      }

      const fileName = `Laporan_Transaksi_${tanggalAwal}_to_${tanggalAkhir}.pdf`;
      doc.save(fileName);

      setSuccessMessage("PDF berhasil diexport");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Gagal mengekspor PDF");
    } finally {
      setExportLoading(false);
    }
  };

  const formatMetodePembayaran = (metode) => {
    const metodeMap = {
      cash: "Cash",
      qr: "QRIS",
      ewallet: "E-Wallet",
      transfer: "Transfer",
      hutang: "Hutang",
    };
    return metodeMap[metode] || metode;
  };

  const getMetodeColor = (metode) => {
    const colorMap = {
      cash: "bg-green-500/20 text-green-400 border-green-500/30",
      qr: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      ewallet: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      transfer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      hutang: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return (
      colorMap[metode] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Memuat laporan...</p>
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
              Laporan Transaksi
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Analisis dan statistik transaksi koperasi
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

        {/* Filter Section */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-4 py-3 rounded-t-xl -mx-4 -mt-4 mb-4">
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter Laporan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-600 text-sm mb-2">
                Tanggal Awal
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={tanggalAwal}
                onChange={(e) => setTanggalAwal(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 text-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={tanggalAkhir}
                onChange={(e) => setTanggalAkhir(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateLaporan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors border border-blue-500 text-sm font-medium"
              >
                Refresh Laporan
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-indigo-500/20 rounded-xl">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Transaksi
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {laporanData.totalTransaksi}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-emerald-500/20 rounded-xl">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Pendapatan
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(laporanData.totalPendapatan)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-orange-500/20 rounded-xl">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400"
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
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Rata-rata Transaksi
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    laporanData.totalTransaksi > 0
                      ? laporanData.totalPendapatan / laporanData.totalTransaksi
                      : 0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Pembayaran */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-3 sm:px-4 py-3">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Metode Pembayaran
            </h2>
            <p className="text-green-200 text-xs sm:text-sm">
              Breakdown berdasarkan metode pembayaran
            </p>
          </div>

          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(laporanData.breakdownPembayaran).map(
                ([metode, jumlah]) => (
                  <div
                    key={metode}
                    className="bg-gray-50 p-3 rounded-xl border border-gray-200 backdrop-blur-sm"
                  >
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                          getMetodeColor(metode).split(" ")[0]
                        }`}
                      >
                        <span className="text-lg">
                          {metode === "cash" && "💵"}
                          {metode === "qr" && "📱"}
                          {metode === "ewallet" && "📲"}
                          {metode === "transfer" && "🏦"}
                          {metode === "hutang" && "📝"}
                        </span>
                      </div>
                      <h3 className="text-white font-medium text-sm mb-1">
                        {formatMetodePembayaran(metode)}
                      </h3>
                      <p className="text-emerald-400 font-bold text-sm">
                        {formatCurrency(jumlah)}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {laporanData.totalPendapatan > 0
                          ? (
                              (jumlah / laporanData.totalPendapatan) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Per Kasir */}
        {laporanData.breakdownKasir &&
          laporanData.breakdownKasir.length > 0 && (
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
                  Breakdown Per Kasir
                </h2>
                <p className="text-purple-200 text-xs sm:text-sm">
                  Performa transaksi per kasir
                </p>
              </div>

              <div className="p-3 sm:p-4 space-y-4">
                {laporanData.breakdownKasir.map((kasir, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200 backdrop-blur-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h3 className="text-white font-medium text-sm sm:text-base">
                        {kasir.nama_kasir}
                      </h3>
                      <div className="text-right">
                        <p className="text-gray-500 text-xs">
                          Transaksi: {kasir.total_transaksi}
                        </p>
                        <p className="text-emerald-400 font-bold text-sm">
                          Total: {formatCurrency(kasir.total_pendapatan || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-green-400 text-xs font-medium">
                          Cash
                        </p>
                        <p className="text-white font-bold text-xs">
                          {formatCurrency(kasir.cash || 0)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-blue-400 text-xs font-medium">
                          QRIS
                        </p>
                        <p className="text-white font-bold text-xs">
                          {formatCurrency(kasir.qr || 0)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <p className="text-purple-400 text-xs font-medium">
                          E-Wallet
                        </p>
                        <p className="text-white font-bold text-xs">
                          {formatCurrency(kasir.ewallet || 0)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <p className="text-indigo-400 text-xs font-medium">
                          Transfer
                        </p>
                        <p className="text-white font-bold text-xs">
                          {formatCurrency(kasir.transfer || 0)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <p className="text-orange-400 text-xs font-medium">
                          Hutang
                        </p>
                        <p className="text-white font-bold text-xs">
                          {formatCurrency(kasir.hutang || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex justify-end">
          <button
            onClick={exportToPDF}
            disabled={exportLoading}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium ${
              exportLoading
                ? "bg-slate-600 text-gray-500 cursor-not-allowed border border-slate-500"
                : "bg-red-600 hover:bg-red-700 text-white border border-red-500 active:scale-95"
            }`}
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
