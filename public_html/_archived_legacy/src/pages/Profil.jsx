// src/pages/Profil.jsx
import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import NavbarMarketplace from "../components/NavbarMarketplace";
import Swal from "sweetalert2";

export default function Profil({ user }) {
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

  const loadProfile = async () => {
    setLoading(true);
    try {
      // First get the latest token user
      const a = await api("autoLogin", "GET");
      if (!a || !a.success || !a.user) {
        throw new Error(a?.error || "Auto-login gagal. Silakan login ulang.");
      }
      setUserTokenObj(a.user);

      // Then get full profile data
      const profilRes = await api("getProfil", "GET");
      if (profilRes && profilRes.success) {
        let profilData = profilRes.data || profilRes.user || profilRes.anggota || null;

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
      }
    } catch (err) {
      console.error("loadProfile error:", err);
      Swal.fire("Error", "Gagal memuat profil: " + err.message, "error");
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

    try {
      if (!userTokenObj || !userTokenObj.user_id) throw new Error("User tidak dikenali.");
      if (!form.nama_lengkap || form.nama_lengkap.trim().length < 2) throw new Error("Nama lengkap minimal 2 karakter.");

      const payload = {
        user_id: userTokenObj.user_id,
        nama_lengkap: form.nama_lengkap.trim(),
      };

      const res = await api("updateProfile", "POST", payload);
      if (res && res.success) {
        Swal.fire("Berhasil", "Profil berhasil diperbarui.", "success");
        await loadProfile();
      } else {
        throw new Error(res?.error || "Gagal update profil");
      }
    } catch (err) {
      Swal.fire("Gagal", err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitChangePassword = async (e) => {
    e && e.preventDefault();
    setChangingPw(true);

    try {
      if (!userTokenObj || !userTokenObj.user_id) throw new Error("User tidak dikenali.");
      if (!pw.current || !pw.next || !pw.confirm) throw new Error("Isi semua field password.");
      if (pw.next !== pw.confirm) throw new Error("Password baru & konfirmasi tidak cocok.");
      if (pw.next.length < 6) throw new Error("Password baru minimal 6 karakter.");

      const payload = {
        user_id: userTokenObj.user_id,
        current_password: pw.current,
        new_password: pw.next,
      };

      const res = await api("changePassword", "POST", payload);
      if (res && res.success) {
        Swal.fire("Berhasil", "Password berhasil diubah.", "success");
        setPw({ current: "", next: "", confirm: "" });
      } else {
        throw new Error(res?.error || "Gagal mengganti password");
      }
    } catch (err) {
      Swal.fire("Gagal", err.message, "error");
    } finally {
      setChangingPw(false);
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

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Akun</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar / Info Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-24 h-24 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-orange-600 border-4 border-white shadow-sm">
                {userTokenObj?.username?.substring(0, 1).toUpperCase() || "U"}
              </div>
              <h2 className="font-bold text-gray-800 text-lg">{userTokenObj?.username}</h2>
              <p className="text-gray-500 text-sm capitalize">{userTokenObj?.role}</p>

              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Member ID</span>
                  <span className="font-medium">{userTokenObj?.user_id}</span>
                </div>
                {member?.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bergabung</span>
                    <span className="font-medium">{new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Forms */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Edit */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Edit Profil
              </h3>
              <form onSubmit={submitProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={form.nama_lengkap}
                    onChange={(e) => handleFormChange("nama_lengkap", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 font-medium"
                  >
                    {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Change */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Ganti Password
              </h3>
              <form onSubmit={submitChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                  <input
                    type="password"
                    value={pw.current}
                    onChange={(e) => setPw(p => ({ ...p, current: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                    <input
                      type="password"
                      value={pw.next}
                      onChange={(e) => setPw(p => ({ ...p, next: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="Min 6 karakter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                    <input
                      type="password"
                      value={pw.confirm}
                      onChange={(e) => setPw(p => ({ ...p, confirm: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="Ulangi password"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPw}
                    className="px-6 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:bg-gray-100 font-medium"
                  >
                    {changingPw ? 'Memproses...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
