// src/pages/Profil.jsx
import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

export default function Profil() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [userTokenObj, setUserTokenObj] = useState(null);
  const [member, setMember] = useState(null);
  const [form, setForm] = useState({
    nama_lengkap: "",
  });

  const [pw, setPw] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const a = await api("autoLogin", "GET");
      if (!a || !a.success || !a.user) {
        throw new Error(a?.error || "Auto-login gagal. Silakan login ulang.");
      }
      setUserTokenObj(a.user);

      const profilRes = await api("getProfil", "GET");
      if (profilRes && profilRes.success) {
        let profilData = null;

        if (profilRes.data) {
          profilData = profilRes.data;
        } else if (profilRes.user) {
          profilData = profilRes.user;
        } else if (profilRes.anggota) {
          profilData = profilRes.anggota;
        }

        if (profilData) {
          setMember(profilData);
          setForm({
            nama_lengkap: profilData.nama_lengkap || a.user.username || "",
          });
        } else {
          setMember(null);
          setForm({
            nama_lengkap: a.user.username || "",
          });
        }
      } else {
        setMember(null);
        setForm({
          nama_lengkap: a.user.username || "",
        });
      }
    } catch (err) {
      console.error("loadProfile error:", err);
      setError(err.message || "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();

    const onStorage = (e) => {
      if (e.key === "token") loadProfile();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleFormChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const submitProfile = async (e) => {
    e && e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setMessage(null);

    try {
      if (!userTokenObj || !userTokenObj.user_id)
        throw new Error("User tidak dikenali. Login ulang.");

      if (!form.nama_lengkap || form.nama_lengkap.trim().length < 2) {
        throw new Error("Nama lengkap minimal 2 karakter.");
      }

      const payload = {
        user_id: userTokenObj.user_id,
        nama_lengkap: form.nama_lengkap.trim(),
      };

      const res = await api("updateProfile", "POST", payload);
      if (res && res.success) {
        setMessage(res.message || "Profil berhasil diperbarui.");
        await loadProfile();
      } else {
        throw new Error(res?.error || "Gagal update profil");
      }
    } catch (err) {
      console.error("submitProfile err:", err);
      setError(err.message || "Error saat menyimpan profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitChangePassword = async (e) => {
    e && e.preventDefault();
    setChangingPw(true);
    setError(null);
    setMessage(null);

    try {
      if (!userTokenObj || !userTokenObj.user_id)
        throw new Error("User tidak dikenali. Login ulang.");
      if (!pw.current || !pw.next || !pw.confirm)
        throw new Error("Isi semua field password.");
      if (pw.next !== pw.confirm)
        throw new Error("Password baru & konfirmasi tidak cocok.");
      if (pw.next.length < 6)
        throw new Error("Password baru minimal 6 karakter.");

      const payload = {
        user_id: userTokenObj.user_id,
        current_password: pw.current,
        new_password: pw.next,
      };

      const res = await api("changePassword", "POST", payload);
      if (res && res.success) {
        setMessage(res.message || "Password berhasil diubah.");
        setPw({ current: "", next: "", confirm: "" });
        setShowPassword({ current: false, next: false, confirm: false });
      } else {
        throw new Error(res?.error || "Gagal mengganti password");
      }
    } catch (err) {
      console.error("submitChangePassword err:", err);
      setError(err.message || "Error saat mengganti password");
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat profil...</p>
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

      <div className="relative z-10 container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Profil Pengguna
          </h1>
          <p className="text-slate-400 mt-2">
            Kelola informasi profil dan keamanan akun Anda
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-500/30 rounded-xl text-green-300 text-sm text-center">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Edit Profil Card */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-6">
            <h2 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Edit Profil
            </h2>
            <form onSubmit={submitProfile}>
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-2">
                  Nama Lengkap
                </label>
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <input
                    value={form.nama_lengkap}
                    onChange={(e) =>
                      handleFormChange("nama_lengkap", e.target.value)
                    }
                    className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 px-1 py-1 text-sm md:text-base w-full"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-3 text-sm md:text-base"
              >
                {savingProfile ? (
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
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Profil"
                )}
              </button>
            </form>
          </div>

          {/* Ganti Password Card */}
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-6">
            <h2 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Ganti Password
            </h2>
            <form onSubmit={submitChangePassword}>
              {/* Current Password */}
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-2">
                  Password Saat Ini
                </label>
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
                      d="M12 11c1.657 0 3 .895 3 2v2H9v-2c0-1.105 1.343-2 3-2zM6 11V8a6 6 0 1112 0v3"
                    />
                  </svg>
                  <input
                    type={showPassword.current ? "text" : "password"}
                    value={pw.current}
                    onChange={(e) =>
                      setPw((prev) => ({ ...prev, current: e.target.value }))
                    }
                    className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 px-1 py-1 text-sm md:text-base w-full"
                    placeholder="Masukkan password saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="ml-2 p-1 rounded-md hover:bg-slate-700/40 transition-colors"
                  >
                    {showPassword.current ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 3C6.278 3 3.06 5.11 1.5 8.5a12.773 12.773 0 0017 0C16.94 5.11 13.722 3 10 3z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.458 12C3.732 7.943 7.523 5 11.999 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.476 0-8.267-2.943-9.541-7z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-2">
                  Password Baru
                </label>
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
                      d="M12 11c1.657 0 3 .895 3 2v2H9v-2c0-1.105 1.343-2 3-2zM6 11V8a6 6 0 1112 0v3"
                    />
                  </svg>
                  <input
                    type={showPassword.next ? "text" : "password"}
                    value={pw.next}
                    onChange={(e) =>
                      setPw((prev) => ({ ...prev, next: e.target.value }))
                    }
                    className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 px-1 py-1 text-sm md:text-base w-full"
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("next")}
                    className="ml-2 p-1 rounded-md hover:bg-slate-700/40 transition-colors"
                  >
                    {showPassword.next ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 3C6.278 3 3.06 5.11 1.5 8.5a12.773 12.773 0 0017 0C16.94 5.11 13.722 3 10 3z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.458 12C3.732 7.943 7.523 5 11.999 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.476 0-8.267-2.943-9.541-7z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-sm text-slate-300 mb-2">
                  Konfirmasi Password Baru
                </label>
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
                      d="M12 11c1.657 0 3 .895 3 2v2H9v-2c0-1.105 1.343-2 3-2zM6 11V8a6 6 0 1112 0v3"
                    />
                  </svg>
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={pw.confirm}
                    onChange={(e) =>
                      setPw((prev) => ({ ...prev, confirm: e.target.value }))
                    }
                    className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 px-1 py-1 text-sm md:text-base w-full"
                    placeholder="Konfirmasi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="ml-2 p-1 rounded-md hover:bg-slate-700/40 transition-colors"
                  >
                    {showPassword.confirm ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 3C6.278 3 3.06 5.11 1.5 8.5a12.773 12.773 0 0017 0C16.94 5.11 13.722 3 10 3z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.458 12C3.732 7.943 7.523 5 11.999 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.476 0-8.267-2.943-9.541-7z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPw}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-3 text-sm md:text-base"
              >
                {changingPw ? (
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
                    Mengubah...
                  </>
                ) : (
                  "Ubah Password"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Ringkasan Profil Card */}
        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Ringkasan Profil
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-600/40 rounded-xl bg-slate-900/40 backdrop-blur-sm">
              <div className="text-sm text-slate-400">User ID</div>
              <div className="font-medium text-white text-lg">
                {userTokenObj?.user_id ?? "-"}
              </div>
            </div>
            <div className="p-4 border border-slate-600/40 rounded-xl bg-slate-900/40 backdrop-blur-sm">
              <div className="text-sm text-slate-400">Username</div>
              <div className="font-medium text-white text-lg">
                {userTokenObj?.username ?? "-"}
              </div>
            </div>
            <div className="p-4 border border-slate-600/40 rounded-xl bg-slate-900/40 backdrop-blur-sm">
              <div className="text-sm text-slate-400">Role</div>
              <div className="font-medium text-white text-lg capitalize">
                {userTokenObj?.role ?? "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Nurdiansyah - Koperasi PK Batam
        </div>
      </div>
    </div>
  );
}
