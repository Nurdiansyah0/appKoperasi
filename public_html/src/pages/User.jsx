// src/pages/User.jsx - UI/UX IMPROVED
import React, { useState, useEffect } from "react";
import { api } from "../utils/api";

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [historiHutang, setHistoriHutang] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);

  const getTokenFromStorage = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return token;
  };

  const fetchUserData = async () => {
    try {
      const token = getTokenFromStorage();
      if (!token) {
        throw new Error("Token tidak ditemukan, silakan login kembali.");
      }

      const userRes = await api("autoLogin", "GET");

      if (!userRes?.success || !userRes.user) {
        throw new Error(userRes?.error || "Auto-login gagal");
      }

      const tokenUser = userRes.user;
      const normalizedUser = {
        id: tokenUser.user_id || tokenUser.id || null,
        anggota_id: tokenUser.anggota_id || null,
        nama_user: tokenUser.username ?? "",
        role: (tokenUser.role ?? "").toLowerCase(),
      };

      setUserData(normalizedUser);
      return normalizedUser;
    } catch (err) {
      setError(err.message || "Gagal memuat data user");
      throw err;
    }
  };

  const fetchProfilData = async () => {
    try {
      const response = await api("getProfil", "GET");

      if (response?.success) {
        if (response.user) {
          setMemberData(response.user);
          return response.user;
        } else if (response.data) {
          setMemberData(response.data);
          return response.data;
        } else if (response.profile) {
          setMemberData(response.profile);
          return response.profile;
        } else {
          throw new Error("Struktur data profil tidak valid");
        }
      } else {
        const errorMsg = response?.error || "Gagal mengambil profil";

        if (errorMsg.includes("Akses ditolak") || errorMsg.includes("denied")) {
          throw new Error(
            "Akses ditolak. Pastikan Anda memiliki izin untuk mengakses data profil."
          );
        } else if (
          errorMsg.includes("tidak ditemukan") ||
          errorMsg.includes("not found")
        ) {
          throw new Error("Data profil tidak ditemukan untuk user ini.");
        } else {
          throw new Error(errorMsg);
        }
      }
    } catch (error) {
      setError(error.message);
      return null;
    }
  };

  const fetchHistori = async (anggotaId) => {
    if (!anggotaId) {
      setError("ID anggota tidak tersedia");
      return;
    }

    try {
      const res = await api("getHistoriBayarHutang", "GET", {
        anggota_id: anggotaId,
        limit: 10,
      });

      if (res?.success) {
        const dataTerbatas = (res.data || []).slice(0, 10);
        setHistoriHutang(dataTerbatas);
      } else {
        setError(res?.error || "Gagal mengambil histori pembayaran");
      }
    } catch (err) {
      setError("Error mengambil histori pembayaran");
    }
  };

  const fetchDataBerubah = async () => {
    try {
      const profil = await fetchProfilData();
      if (profil && profil.anggota_id) {
        await fetchHistori(profil.anggota_id);
      }
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || "Gagal memuat data terbaru");
    }
  };

  const initializeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = await fetchUserData();

      if (user?.role === "anggota") {
        await fetchDataBerubah();
      }
    } catch (err) {
      setError(err.message || "Gagal memuat data user");
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    let intervalId;
    let isMounted = true;

    const init = async () => {
      if (!isMounted) return;
      await initializeData();
    };

    init();

    intervalId = setInterval(async () => {
      if (isMounted) {
        await fetchDataBerubah();
      }
    }, 15000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const safeMemberData = memberData || {
    saldo: 0,
    hutang: 0,
    shu: 0,
    nama_lengkap: userData?.nama_user || "Anggota",
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount || 0);

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleBayarHutang = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const amount = Number(e.target.amount.value);

    if (!amount || amount <= 0) {
      alert("Masukkan nominal valid (minimal Rp 1,000)");
      setSubmitting(false);
      return;
    }

    if (amount > (safeMemberData.hutang || 0)) {
      alert(
        `Nominal pembayaran (${formatCurrency(
          amount
        )}) tidak boleh melebihi hutang saat ini (${formatCurrency(
          safeMemberData.hutang
        )})`
      );
      setSubmitting(false);
      return;
    }

    try {
      const anggotaId = memberData?.anggota_id || userData?.anggota_id;
      if (!anggotaId) {
        alert("Data anggota tidak lengkap, silakan refresh halaman");
        return;
      }

      const res = await api("bayarHutang", "POST", {
        anggota_id: anggotaId,
        jumlah: amount,
      });

      if (res?.success) {
        alert(
          "Permintaan pembayaran berhasil dikirim! Menunggu persetujuan kasir."
        );

        setTimeout(() => {
          fetchDataBerubah();
        }, 2000);

        e.target.reset();
      } else {
        alert(
          res?.error || res?.message || "Gagal mengajukan pembayaran hutang"
        );
      }
    } catch (err) {
      alert("Terjadi kesalahan server: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error && !memberData) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a] py-8 px-4">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[26rem] h-[26rem] rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Dashboard Anggota
            </h1>
            <p className="text-slate-400 mt-1">
              Kelola keuangan dan pantau hutang Anda
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-300">
              Halo,{" "}
              <span className="font-medium text-white">
                {safeMemberData.nama_lengkap}
              </span>
            </div>
            <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
              🔄 Terupdate: {formatTime(lastUpdate)}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-900/50 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-lg">
            <div className="flex items-center">
              <span className="text-yellow-400 mr-2">⚠</span>
              <span className="text-yellow-200">{error}</span>
            </div>
          </div>
        )}

        {/* Card Saldo, Hutang, SHU */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">Saldo</p>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(safeMemberData.saldo)}
            </p>
          </div>

          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">Hutang</p>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {formatCurrency(safeMemberData.hutang)}
            </p>
          </div>

          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">SHU</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {formatCurrency(safeMemberData.shu)}
            </p>
          </div>
        </div>

        {/* Form Bayar Hutang & Histori */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Bayar Hutang */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              Bayar Hutang
            </h2>

            {safeMemberData.hutang > 0 ? (
              <>
                <form onSubmit={handleBayarHutang} className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-3 transition-shadow focus-within:shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    <input
                      type="number"
                      name="amount"
                      min="1000"
                      step="1000"
                      max={safeMemberData.hutang}
                      placeholder={`Maksimal: ${formatCurrency(
                        safeMemberData.hutang
                      )}`}
                      className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 px-1 py-1 text-sm md:text-base w-full"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-3"
                  >
                    {submitting ? (
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
                        Mengajukan...
                      </>
                    ) : (
                      "Ajukan Pembayaran"
                    )}
                  </button>
                </form>
                <p className="text-sm text-slate-400 mt-3 text-center">
                  Permintaan pembayaran akan diproses setelah disetujui oleh
                  kasir.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-emerald-400 text-4xl mb-2">🎉</div>
                <p className="text-emerald-400 font-medium">
                  Tidak ada hutang yang perlu dibayar.
                </p>
              </div>
            )}
          </div>

          {/* Histori Pembayaran Hutang */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-indigo-400"
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
                Histori Pembayaran
              </h3>
              <span className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
                {historiHutang.length} transaksi
              </span>
            </div>

            {historiHutang.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {historiHutang.map((item) => (
                  <div
                    key={item.pembayaran_id}
                    className="p-4 border border-slate-600/40 rounded-xl bg-slate-900/40 backdrop-blur-sm hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-slate-300 text-sm">
                        {new Date(item.created_at).toLocaleString("id-ID")}
                      </div>
                      <span
                        className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${
                            item.status === "pending"
                              ? "bg-yellow-900/50 text-yellow-200 border border-yellow-500/30"
                              : item.status === "approved"
                              ? "bg-green-900/50 text-green-200 border border-green-500/30"
                              : "bg-red-900/50 text-red-200 border border-red-500/30"
                          }
                        `}
                      >
                        {item.status === "pending"
                          ? "Menunggu"
                          : item.status === "approved"
                          ? "Disetujui"
                          : "Ditolak"}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(item.nominal)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-500 text-4xl mb-2">📝</div>
                <p className="text-slate-500">Belum ada histori pembayaran</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Nurdiansyah - Koperasi PK Batam
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
