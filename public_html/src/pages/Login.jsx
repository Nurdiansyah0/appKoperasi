// src/pages/Login.jsx (DIPERBAIKI)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../utils/api"; // IMPORT setToken

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Normalisasi user data sama seperti di App.jsx
  const normalizeUser = (userData) => {
    if (!userData) return null;
    
    return {
      id: userData.user_id || userData.id || null,
      username: userData.username || userData.nama_user || "",
      nama_user: userData.nama_user || userData.username || "",
      role: (userData.role || "").toLowerCase(),
      ...userData
    };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      if (!trimmedUsername || !trimmedPassword) {
        setError("Username dan password harus diisi");
        setLoading(false);
        return;
      }

      console.log("🔍 Attempting login...");
      const res = await api("login", "POST", {
        username: trimmedUsername,
        password: trimmedPassword,
      });

      console.log("🔍 Login response:", res);

      if (res && res.success && res.token && res.user) {
        // Gunakan setToken dari api.js untuk konsistensi
        setToken(res.token, rememberMe);
        
        const normalizedUser = normalizeUser(res.user);
        console.log("✅ Login successful:", normalizedUser);
        
        onLogin(normalizedUser);

        // Navigasi berdasarkan role
        switch (normalizedUser.role) {
          case "kasir":
            navigate("/kasir");
            break;
          case "admin":
            navigate("/dashboard");
            break;
          case "anggota":
            navigate("/user");
            break;
          default:
            navigate("/");
            break;
        }
      } else {
        const errorMessage = res?.error || res?.message || "Login gagal. Silakan coba lagi.";
        setError(errorMessage);
        console.error("❌ Login failed:", errorMessage);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message || "Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ... (JSX UI tetap sama, tidak perlu diubah)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a] p-4">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[26rem] h-[26rem] rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      {/* Card */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* Logo untuk mobile - di atas form */}
        <div className="flex flex-col items-center mb-6 md:hidden">
          <img src="/Logo.svg" alt="Logo Koperasi" className="h-20 w-20 mb-3" />
          <h2 className="text-xl font-semibold text-white text-center">
            Koperasi PK Batam
          </h2>
          <p className="text-slate-400 text-xs text-center mt-1">
            Elevate — Beyond Technology
          </p>
        </div>

        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-3xl shadow-2xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Masuk ke akun
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Masukkan kredensial Anda untuk melanjutkan
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            {/* Username */}
            <label className="relative block">
              <span className="sr-only">Username</span>
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
                    d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM6 21v-2a4 4 0 014-4h4"
                  />
                </svg>
                <input
                  name="username"
                  type="text"
                  placeholder="Username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 px-1 py-1 text-sm md:text-base"
                  aria-label="Username"
                />
              </div>
            </label>

            {/* Password */}
            <label className="relative block">
              <span className="sr-only">Password</span>
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-transparent flex-1 outline-none placeholder-slate-500 text-slate-200 px-1 py-1 text-sm md:text-base"
                  aria-label="Password"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  onClick={() => setShowPassword((s) => !s)}
                  className="ml-2 p-1 rounded-md hover:bg-slate-700/40 transition-colors"
                >
                  {showPassword ? (
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
            </label>

            {/* Remember Me */}
            <div className="flex items-center justify-between mt-2">
              <label className="inline-flex items-center text-sm text-slate-300">
                <input
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                Ingat saya
              </label>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-3 text-sm md:text-base"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Sedang login...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Nurdiansyah - Koperasi PK Batam
        </div>
      </form>
    </div>
  );
}