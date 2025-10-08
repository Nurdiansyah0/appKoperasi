import { useState } from "react";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function SetorAdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nominal, setNominal] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());

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
    setMessage("");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleSetor = async (e) => {
    e.preventDefault();

    if (!nominal || nominal <= 0) {
      setMessage("Nominal harus lebih dari 0");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await api("setorAdmin", "POST", {
        nominal: parseFloat(nominal),
      });

      if (res?.success) {
        setMessage(
          `Setoran berhasil dikirim ke admin! ID Setoran: ${res.setoran_id}`
        );
        setNominal("");
        setLastUpdate(new Date());
      } else {
        setMessage(res?.error || "Gagal melakukan setoran");
      }
    } catch (error) {
      setMessage("Terjadi kesalahan saat melakukan setoran");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a] py-4 px-3 sm:px-4">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[26rem] h-[26rem] rounded-full bg-amber-500/6 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto max-w-2xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Setor ke Admin
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Setor hasil penjualan harian ke admin untuk verifikasi
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

        {/* Main Content */}
        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Form Setoran
            </h2>
            <p className="text-amber-200 text-xs sm:text-sm">
              Isi nominal setoran hasil penjualan harian
            </p>
          </div>

          <div className="p-4 sm:p-6">
            <form onSubmit={handleSetor} className="space-y-6">
              {/* Nominal Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nominal Setoran
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    placeholder="Masukkan nominal setoran"
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-medium pr-20"
                    min="1"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-400 text-sm">IDR</span>
                  </div>
                </div>
                {nominal && (
                  <div className="mt-2 text-sm text-emerald-400 font-medium">
                    {formatCurrency(nominal)}
                  </div>
                )}
              </div>

              {/* Messages */}
              {message && (
                <div
                  className={`p-3 sm:p-4 rounded-xl backdrop-blur-lg border ${
                    message.includes("berhasil")
                      ? "bg-emerald-900/50 border-emerald-500/30 text-emerald-300"
                      : "bg-red-900/50 border-red-500/30 text-red-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex-1">{message}</span>
                    <button
                      onClick={clearMessages}
                      className={`ml-2 ${
                        message.includes("berhasil")
                          ? "text-emerald-400 hover:text-emerald-200"
                          : "text-red-400 hover:text-red-200"
                      } transition-colors`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !nominal || nominal <= 0}
                className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 sm:py-4 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 text-sm sm:text-base border border-amber-500"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                    Memproses Setoran...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Setor ke Admin
                  </>
                )}
              </button>
            </form>

            {/* Information Panel */}
            <div className="mt-6 p-4 bg-slate-700/40 rounded-xl border border-slate-600/40 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
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
                <h3 className="text-slate-300 font-medium text-sm sm:text-base">
                  Informasi Setoran
                </h3>
              </div>
              <ul className="text-slate-400 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>
                    Setoran akan dikirim ke admin untuk verifikasi dan approval
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>
                    Pastikan nominal sesuai dengan hasil penjualan harian yang
                    sebenarnya
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Setoran yang sudah dikirim tidak dapat dibatalkan</span>
                </li>
              </ul>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Nominal Cepat
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[50000, 100000, 250000, 500000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setNominal(amount.toString())}
                    className="px-3 py-2 bg-slate-700/60 hover:bg-slate-600/60 border border-slate-600/40 rounded-xl text-slate-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-tr from-blue-900/50 to-blue-800/40 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-blue-300 font-medium text-sm">Keamanan</h3>
            </div>
            <p className="text-blue-200 text-xs">
              Setoran Anda aman dan tercatat dalam sistem
            </p>
          </div>

          <div className="bg-gradient-to-tr from-emerald-900/50 to-emerald-800/40 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-emerald-300 font-medium text-sm">Cepat</h3>
            </div>
            <p className="text-emerald-200 text-xs">
              Proses setoran instan dan real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
