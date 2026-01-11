// src/App.jsx (DIPERBAIKI)
import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import KasirUnified from "./pages/kasir/KasirUnified"; // Unified kasir dashboard
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
import ProductDetail from "./pages/ProductDetail"; // NEW
import Cart from "./pages/Cart"; // NEW
import Navbar from "./components/Navbar";
import AdminLayout from "./layouts/AdminLayout";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { api, getToken, removeToken } from "./utils/api"; // IMPORT FUNGSI TOKEN
import { CartProvider } from "./context/CartContext"; // IMPORT PROVIDER

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
        return "/belanja"; // Default home for members is Belanja
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
    <CartProvider>
      <HashRouter>
        <MainContent user={user} setUser={setUser} getRouteByRole={getRouteByRole} />
      </HashRouter>
    </CartProvider>
  );
}

// Separate component to use useLocation hook
function MainContent({ user, setUser, getRouteByRole }) {
  const { pathname } = useLocation();

  // Routes where the default Navbar should be hidden (for members)
  const hideNavbarRoutes = ['/belanja', '/product', '/cart', '/riwayat', '/profil'];
  const shouldHideNavbar = hideNavbarRoutes.some(route => pathname.startsWith(route));
  const isMemberRoute = hideNavbarRoutes.some(route => pathname.startsWith(route));

  // Global Light Theme
  const bgClass = "bg-gray-50 text-gray-900";

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Navbar for Members/Public Only - Admin uses Sidebar */}
      {user && user.role === 'anggota' && !shouldHideNavbar && <Navbar user={user} setUser={setUser} />}

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

          {/* ADMIN & KASIR LAYOUT WRAPPER */}
          <Route element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'kasir', 'owner']}>
              <AdminLayout user={user} setUser={setUser} />
            </ProtectedRoute>
          }>
            {/* ADMIN ROUTES */}
            <Route path="/dashboard" element={<DashboardAdmin user={user} />} />
            <Route path="/stok" element={<Stok user={user} />} />
            <Route path="/shu-management" element={<ShuManagement user={user} />} />
            <Route path="/monitor-barang" element={<MonitorBarang user={user} />} />
            <Route path="/anggota" element={<KelolaAnggota user={user} />} />
            <Route path="/kasir-management" element={<KelolaKasir user={user} />} />
            <Route path="/laporan" element={<Laporan user={user} />} />

            {/* KASIR ROUTES - Unified Dashboard */}
            <Route path="/kasir" element={<KasirUnified user={user} />} />
            <Route path="/kasir/:tab" element={<KasirUnified user={user} />} />

            {/* Backward Compatibility Redirects */}
            <Route path="/kasir/input-penjualan" element={<Navigate to="/kasir/penjualan" replace />} />
            <Route path="/kasir/history" element={<Navigate to="/kasir/riwayat" replace />} />
            <Route path="/kasir/pembayaran-hutang" element={<Navigate to="/kasir/hutang" replace />} />
            <Route path="/kasir/opname-stok" element={<Navigate to="/kasir/stok" replace />} />
            <Route path="/kasir/review-opname" element={<Navigate to="/kasir/stok" replace />} />
            <Route path="/kasir/setor-admin" element={<Navigate to="/kasir/keuangan" replace />} />
            <Route path="/kasir/tarik-tunai" element={<Navigate to="/kasir/keuangan" replace />} />
          </Route>

          {/* ANGGOTA ROUTES - Keep outside AdminLayout */}
          <Route path="/user" element={<ProtectedRoute user={user} allowedRoles={["anggota"]}><User user={user} /></ProtectedRoute>} />
          <Route path="/belanja" element={<ProtectedRoute user={user} allowedRoles={["anggota"]}><Belanja user={user} /></ProtectedRoute>} />
          <Route path="/product/:id" element={<ProtectedRoute user={user} allowedRoles={["anggota"]}><ProductDetail user={user} /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute user={user} allowedRoles={["anggota"]}><Cart user={user} /></ProtectedRoute>} />
          <Route path="/riwayat" element={<ProtectedRoute user={user} allowedRoles={["anggota"]}><Riwayat user={user} /></ProtectedRoute>} />

          {/* SHARED ROUTES */}
          {/* Profil uses AdminLayout if admin/kasir, stand-alone if member. We can split logic or just keep it simple. */}
          {/* For now, let's keep it simple. If admin, it shows inside layout. */}
          <Route path="/profil" element={
            user && (user.role === 'admin' || user.role === 'kasir')
              ? <AdminLayout user={user} setUser={setUser}><Profil user={user} setUser={setUser} /></AdminLayout>
              : <ProtectedRoute user={user} allowedRoles={["anggota", "admin", "kasir"]}><Profil user={user} setUser={setUser} /></ProtectedRoute>
          } />

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

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">404 - Halaman Tidak Ditemukan</h1>
                  <button onClick={() => (window.location.href = "/")} className="bg-orange-500 text-white px-4 py-2 rounded">Kembali</button>
                </div>
              </div>
            }
          />
        </Routes>
      </main>

      {/* Footer - Only for members */}
      {user && user.role === 'anggota' && <Footer />}
    </div>
  );
}

export default App;