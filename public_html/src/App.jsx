// src/App.jsx (DIPERBAIKI)
import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Kasir from "./pages/Kasir";
import KasirPembayaranHutang from "./pages/KasirPembayaranHutang";
import InputPenjualan from "./pages/InputPenjualan";
import OpnameStok from "./pages/OpnameStok";
import ReviewOpname from "./pages/ReviewOpname";
import HistoryTransaksi from "./pages/HistoryTransaksi";
import Stok from "./pages/Stock";
import DashboardAdmin from "./pages/Dashboard";
import ShuManagement from "./pages/ShuManagement";
import KelolaAnggota from "./pages/KelolaAnggota";
import KelolaKasir from "./pages/KelolaKasir";
import Laporan from "./pages/Laporan";
import User from "./pages/User";
import Belanja from "./pages/Belanja";
import Riwayat from "./pages/Riwayat";
import Profil from "./pages/Profil";
import SetorAdminPage from "./pages/SetorAdmin";
import TarikTunaiPage from "./pages/TarikTunai";
import MonitorBarang from "./pages/MonitorBarang";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { api, getToken, removeToken } from "./utils/api"; // IMPORT FUNGSI TOKEN

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Map role ke route
  const getRouteByRole = (role) => {
    switch (role) {
      case "kasir":
        return "/kasir";
      case "admin":
        return "/dashboard";
      case "anggota":
        return "/user";
      default:
        return "/login";
    }
  };

  // Normalisasi user data secara konsisten
  const normalizeUser = (userData) => {
    if (!userData) return null;
    
    return {
      id: userData.user_id || userData.id || null,
      username: userData.username || userData.nama_user || "",
      nama_user: userData.nama_user || userData.username || "",
      role: (userData.role || "").toLowerCase(),
      // Tambahkan field lain jika diperlukan
      ...userData
    };
  };

  // Auto-login saat App mount
  useEffect(() => {
    const tryAutoLogin = async () => {
      setCheckingAuth(true);
      const token = getToken();
      
      console.log("🔍 Auto-login check - Token:", token ? "Ada" : "Tidak Ada");
      
      if (!token) {
        console.log("🔍 No token found, skipping auto-login");
        setCheckingAuth(false);
        setUser(null);
        return;
      }

      try {
        console.log("🔍 Attempting auto-login...");
        const res = await api("autoLogin", "GET");
        console.log("🔍 Auto-login response:", res);
        
        if (res && res.success && res.user) {
          const normalizedUser = normalizeUser(res.user);
          console.log("✅ Auto-login successful:", normalizedUser);
          setUser(normalizedUser);
        } else {
          console.log("❌ Auto-login failed:", res?.error);
          removeToken();
          setUser(null);
        }
      } catch (err) {
        console.error("❌ Auto-login error:", err);
        removeToken();
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    tryAutoLogin();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl">Memeriksa sesi...</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Navbar */}
        {user && <Navbar user={user} setUser={setUser} />}

        {/* Main content area */}
        <main className="flex-1">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={getRouteByRole(user.role)} replace />
                ) : (
                  <Login onLogin={setUser} />
                )
              }
            />

            {/* KASIR ROUTES */}
            <Route
              path="/kasir"
              element={
                <ProtectedRoute user={user} allowedRoles={["kasir"]}>
                  <Kasir user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kasir/input-penjualan"
              element={
                <ProtectedRoute user={user} allowedRoles={["kasir"]}>
                  <InputPenjualan user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kasir/pembayaran-hutang"
              element={
                <ProtectedRoute user={user} allowedRoles={["kasir"]}>
                  <KasirPembayaranHutang user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kasir/opname-stok"
              element={
                <ProtectedRoute user={user} allowedRoles={["kasir"]}>
                  <OpnameStok user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kasir/review-opname"
              element={
                <ProtectedRoute user={user} allowedRoles={["kasir"]}>
                  <ReviewOpname user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kasir/history"
              element={
                <ProtectedRoute user={user} allowedRoles={["kasir"]}>
                  <HistoryTransaksi user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kasir/setor-admin"
              element={
                <ProtectedRoute user={user} allowedRoles={["kasir"]}>
                  <SetorAdminPage user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kasir/tarik-tunai"
              element={
                <ProtectedRoute user={user} allowedRoles={["kasir"]}>
                  <TarikTunaiPage user={user} />
                </ProtectedRoute>
              }
            />

            {/* ADMIN ROUTES */}
            <Route
              path="/stok"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <Stok user={user} />
                </ProtectedRoute>
              }
            />
          <Route
              path="/shu-management"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <ShuManagement user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <DashboardAdmin user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/monitor-barang"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <MonitorBarang user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/anggota"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <KelolaAnggota user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kasir-management"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <KelolaKasir user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/laporan"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <Laporan user={user} />
                </ProtectedRoute>
              }
            />

            {/* ANGGOTA ROUTES */}
            <Route
              path="/user"
              element={
                <ProtectedRoute user={user} allowedRoles={["anggota"]}>
                  <User user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/belanja"
              element={
                <ProtectedRoute user={user} allowedRoles={["anggota"]}>
                  <Belanja user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/riwayat"
              element={
                <ProtectedRoute user={user} allowedRoles={["anggota"]}>
                  <Riwayat user={user} />
                </ProtectedRoute>
              }
            />

            {/* SHARED ROUTES */}
            <Route
              path="/profil"
              element={
                <ProtectedRoute
                  user={user}
                  allowedRoles={["kasir", "admin", "anggota"]}
                >
                  <Profil user={user} setUser={setUser} />
                </ProtectedRoute>
              }
            />

            {/* DEFAULT ROUTE */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={getRouteByRole(user.role)} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* 404 NOT FOUND ROUTE */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center text-white">
                    <h1 className="text-2xl font-bold mb-4">
                      404 - Halaman Tidak Ditemukan
                    </h1>
                    <p className="mb-4">Halaman yang Anda cari tidak ada.</p>
                    {user ? (
                      <button
                        onClick={() =>
                          (window.location.href = getRouteByRole(user.role))
                        }
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                      >
                        Kembali ke Dashboard
                      </button>
                    ) : (
                      <button
                        onClick={() => (window.location.href = "/login")}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                      >
                        Ke Halaman Login
                      </button>
                    )}
                  </div>
                </div>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        {user && <Footer />}
      </div>
    </HashRouter>
  );
}

export default App;