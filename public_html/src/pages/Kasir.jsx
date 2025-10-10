// src/pages/Kasir.jsx - FIXED VERSION (Sound only for new orders)
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

// Komponen Notification Popup
const NotificationPopup = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "new_order":
        return "🆕";
      default:
        return "ℹ️";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-900/80 border-green-500/50";
      case "warning":
        return "bg-orange-900/80 border-orange-500/50";
      case "error":
        return "bg-red-900/80 border-red-500/50";
      case "new_order":
        return "bg-purple-900/80 border-purple-500/50";
      default:
        return "bg-blue-900/80 border-blue-500/50";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${getBgColor()} border backdrop-blur-lg rounded-xl p-4 min-w-80 shadow-2xl transform animate-slide-in-right`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white transition-colors flex-shrink-0 text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Utility untuk memutar suara - SIMPLIFIED VERSION
const useAudio = () => {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          console.log("Web Audio API tidak didukung di browser ini");
          return;
        }

        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Untuk mobile, tunggu interaksi pengguna dulu
        if (ctx.state === "suspended") {
          const handleUserInteraction = async () => {
            try {
              await ctx.resume();
              console.log("Audio context di-resume");
              setIsAudioReady(true);
              
              // Hapus event listeners setelah berhasil resume
              document.removeEventListener("click", handleUserInteraction);
              document.removeEventListener("touchstart", handleUserInteraction);
              document.removeEventListener("keydown", handleUserInteraction);
            } catch (error) {
              console.log("Gagal resume audio context:", error);
            }
          };

          // Tambah event listeners
          document.addEventListener("click", handleUserInteraction);
          document.addEventListener("touchstart", handleUserInteraction);
          document.addEventListener("keydown", handleUserInteraction);
        } else {
          setIsAudioReady(true);
        }
      } catch (error) {
        console.log("Error initializing audio context:", error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playNewOrderSound = useCallback(() => {
    if (!audioContextRef.current || !isAudioReady) {
      console.log("Audio belum ready, notifikasi tanpa suara");
      return;
    }

    try {
      const ctx = audioContextRef.current;
      
      // Pastikan audio context aktif
      if (ctx.state === "suspended") {
        ctx.resume().catch(console.error);
        return; // Skip jika masih suspended
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Suara khusus untuk pesanan baru - lebih menarik
      const now = ctx.currentTime;
      
      // Pattern: naik-turun-naik (lebih attention-grabbing)
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.setValueAtTime(400, now + 0.1);
      oscillator.frequency.setValueAtTime(1000, now + 0.2);
      oscillator.frequency.setValueAtTime(600, now + 0.3);
      
      // Envelope volume
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      oscillator.start(now);
      oscillator.stop(now + 0.4);

      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };

    } catch (error) {
      console.log("Error playing new order sound:", error);
    }
  }, [isAudioReady]);

  return { playNewOrderSound, isAudioReady };
};

export default function Kasir({ user }) {
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [stats, setStats] = useState({
    totalPenjualanHariIni: 0,
    totalTransaksiHariIni: 0,
    hutangBelumLunas: 0,
    stokMenipis: 0,
  });
  
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Custom hook untuk audio - HANYA untuk pesanan baru
  const { playNewOrderSound, isAudioReady } = useAudio();

  // Refs untuk mencegah race condition dan duplikasi notifikasi
  const isMountedRef = useRef(true);
  const cartRef = useRef(cart);
  const ordersRef = useRef([]);
  const transactionsRef = useRef([]);
  const knownOrderIds = useRef(new Set()); // Track semua pesanan yang pernah diketahui

  // Update ref ketika data berubah
  useEffect(() => {
    cartRef.current = cart;
    ordersRef.current = orders;
    transactionsRef.current = recentTransactions;
  }, [cart, orders, recentTransactions]);

  const addNotification = useCallback((message, type = "info", playSound = false) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Hanya putar suara jika specifically diminta (untuk pesanan baru)
    if (playSound && type === "new_order") {
      playNewOrderSound();
    }
  }, [playNewOrderSound]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const normalizePesanan = useCallback(
    (tr) => ({
      transaksi_id: Number(tr.transaksi_id),
      anggota_id: tr.anggota_id,
      nama_anggota: tr.nama_anggota,
      metode_pembayaran: tr.metode_pembayaran,
      total_harga: Number(tr.total_harga || 0),
      items: (tr.items || []).map((item) => ({
        barang_id: item.barang_id,
        nama_item: item.nama_barang,
        harga_jual: Number(item.harga_satuan),
        jumlah: Number(item.jumlah),
      })),
    }),
    []
  );

  // Fungsi untuk mendeteksi pesanan baru - IMPROVED
  const checkForNewOrders = useCallback((newOrders, oldOrders) => {
    if (!oldOrders.length) {
      // Inisialisasi: tambahkan semua order pertama ke known orders
      newOrders.forEach(order => {
        knownOrderIds.current.add(order.transaksi_id);
      });
      return;
    }

    // Cari pesanan yang benar-benar baru (belum pernah diketahui sama sekali)
    const trulyNewOrders = newOrders.filter(order => 
      !knownOrderIds.current.has(order.transaksi_id)
    );

    if (trulyNewOrders.length > 0) {
      // Tampilkan notifikasi dengan suara HANYA untuk pesanan baru
      addNotification(
        `${trulyNewOrders.length} pesanan baru masuk dari ${trulyNewOrders[0].nama_anggota}${trulyNewOrders.length > 1 ? ` dan ${trulyNewOrders.length - 1} lainnya` : ''}`,
        "new_order",
        true // Play sound hanya untuk notifikasi ini
      );
      
      // Tandai pesanan ini sebagai sudah diketahui
      trulyNewOrders.forEach(order => {
        knownOrderIds.current.add(order.transaksi_id);
      });
    }

    // Update known orders dengan semua order yang sekarang ada
    newOrders.forEach(order => {
      knownOrderIds.current.add(order.transaksi_id);
    });
  }, [addNotification]);

  // Fungsi untuk mendeteksi transaksi baru - TANPA SUARA
  const checkForNewTransactions = useCallback((newTransactions, oldTransactions) => {
    if (!oldTransactions.length) return;

    const oldTransactionIds = new Set(oldTransactions.map(t => t.id));
    const newTransactionsCount = newTransactions.filter(t => !oldTransactionIds.has(t.id)).length;

    if (newTransactionsCount > 0) {
      addNotification(`${newTransactionsCount} transaksi baru diproses`, "info", false); // NO SOUND
    }
  }, [addNotification]);

  const loadData = useCallback(async (silent = false) => {
    if (!user || !isMountedRef.current) return;

    try {
      if (!silent) {
        setIsLoading(true);
      }

      const pesananRes = await api("getPesananAnggota");

      if (isMountedRef.current && pesananRes?.success) {
        const data = Array.isArray(pesananRes.data) 
          ? pesananRes.data.map(normalizePesanan)
          : [];

        // Selalu cek pesanan baru, bahkan pada silent refresh
        checkForNewOrders(data, ordersRef.current);

        setOrders(data);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      if (isMountedRef.current) {
        setOrders([]);
      }
    } finally {
      if (isMountedRef.current && !silent) {
        setIsLoading(false);
      }
    }
  }, [user, normalizePesanan, checkForNewOrders]);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!isMountedRef.current) return;

    try {
      if (!silent) {
        setDashboardLoading(true);
      }
      setError("");

      const [statsRes, transactionsRes] = await Promise.all([
        api("getDashboardKasir", "GET"),
        api("getTransaksiTerbaru", "GET")
      ]);

      if (isMountedRef.current) {
        // Process stats
        if (statsRes?.success) {
          let dashboardData = statsRes.data;

          if (dashboardData && typeof dashboardData === "object") {
            setStats({
              totalPenjualanHariIni: dashboardData.totalPenjualanHariIni || 0,
              totalTransaksiHariIni: dashboardData.totalTransaksiHariIni || 0,
              hutangBelumLunas: dashboardData.hutangBelumLunas || 0,
              stokMenipis: dashboardData.stokMenipis || 0,
            });
          } else if (statsRes.data && statsRes.data.data) {
            setStats({
              totalPenjualanHariIni: statsRes.data.data.totalPenjualanHariIni || 0,
              totalTransaksiHariIni: statsRes.data.data.totalTransaksiHariIni || 0,
              hutangBelumLunas: statsRes.data.data.hutangBelumLunas || 0,
              stokMenipis: statsRes.data.data.stokMenipis || 0,
            });
          }
        } else {
          setError(statsRes?.error || "Gagal memuat data statistik");
        }

        // Process transactions
        if (transactionsRes?.success) {
          let transactionsData = transactionsRes.data;

          if (Array.isArray(transactionsData)) {
            if (!silent || transactionsRef.current.length > 0) {
              checkForNewTransactions(transactionsData, transactionsRef.current);
            }
            setRecentTransactions(transactionsData);
          } else if (transactionsRes.data && Array.isArray(transactionsRes.data.data)) {
            const dataArray = transactionsRes.data.data;
            if (!silent || transactionsRef.current.length > 0) {
              checkForNewTransactions(dataArray, transactionsRef.current);
            }
            setRecentTransactions(dataArray);
          }
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (isMountedRef.current) {
        setError("Terjadi kesalahan saat memuat data dashboard");
      }
    } finally {
      if (isMountedRef.current) {
        if (!silent) {
          setDashboardLoading(false);
        }
        setLastUpdate(new Date());
      }
    }
  }, [checkForNewTransactions]);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;

    const initializeData = async () => {
      if (user) {
        await loadData();
        await loadDashboardData();
      }
    };

    initializeData();

    // Auto-refresh
    const interval = setInterval(() => {
      if (isMountedRef.current && user) {
        loadData(true);
        loadDashboardData(true);
      }
    }, 10000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [user, loadData, loadDashboardData]);

  const tambahKeCart = useCallback((transaksi) => {
    const existingInCart = cartRef.current.some(
      (c) => c.transaksi_id === transaksi.transaksi_id
    );
    if (existingInCart) {
      setError("Transaksi ini sudah ada di keranjang!");
      return;
    }

    const cartItems = transaksi.items.map((item) => ({
      ...item,
      transaksi_id: Number(transaksi.transaksi_id),
      anggota_id: transaksi.anggota_id,
      nama_anggota: transaksi.nama_anggota,
      metode_pembayaran: transaksi.metode_pembayaran,
      total_harga: transaksi.total_harga,
    }));

    setCart((prev) => [...prev, ...cartItems]);
    setError(null);
    addNotification(
      `Pesanan dari ${transaksi.nama_anggota} ditambahkan ke proses`,
      "info",
      false // NO SOUND
    );
  }, [addNotification]);

  const updateCartItem = useCallback((id, transaksi_id, jumlah) => {
    if (jumlah < 1) {
      setCart((prev) =>
        prev.filter(
          (c) => !(c.barang_id === id && c.transaksi_id === transaksi_id)
        )
      );
    } else {
      setCart((prev) =>
        prev.map((c) =>
          c.barang_id === id && c.transaksi_id === transaksi_id
            ? { ...c, jumlah }
            : c
        )
      );
    }
  }, []);

  const hapusCartItem = useCallback((id, transaksi_id) => {
    setCart((prev) =>
      prev.filter(
        (c) => !(c.barang_id === id && c.transaksi_id === transaksi_id)
      )
    );
  }, []);

  const hapusTransaksiDariCart = useCallback((transaksi_id) => {
    setCart((prev) => prev.filter((c) => c.transaksi_id !== transaksi_id));
  }, []);

  const hitungTotal = useCallback(
    () => cart.reduce((sum, c) => sum + c.harga_jual * c.jumlah, 0),
    [cart]
  );

  const tandaiSelesai = async () => {
    if (cart.length === 0) {
      setError("Keranjang kosong!");
      return;
    }

    setProcessing(true);
    try {
      const uniqueTransaksi = {};
      cart.forEach((item) => {
        const transaksiIdNum = Number(item.transaksi_id);

        if (!uniqueTransaksi[transaksiIdNum]) {
          uniqueTransaksi[transaksiIdNum] = {
            transaksi_id: transaksiIdNum,
            items: [],
          };
        }
        uniqueTransaksi[transaksiIdNum].items.push({
          barang_id: item.barang_id,
          jumlah: item.jumlah,
          harga_satuan: item.harga_jual,
        });
      });

      const payload = {
        transaksi: Object.values(uniqueTransaksi),
      };

      const res = await api("simpanTransaksiKasir", "POST", payload);

      if (res && res.success) {
        const successMsg = `Transaksi berhasil diselesaikan! ${res.processed_count} transaksi diproses.`;
        setSuccessMessage(successMsg);
        addNotification(successMsg, "success", false);
        setCart([]);
        setError(null);

        // Refresh data setelah sukses
        setTimeout(() => {
          loadData(true);
          loadDashboardData(true);
        }, 1000);

        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        throw new Error(res?.message || "Unknown error");
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = "Terjadi kesalahan saat menyelesaikan transaksi.";
      setError(errorMsg);
      addNotification(errorMsg, "error", false);
    } finally {
      setProcessing(false);
    }
  };

  const groupedCart = cart.reduce((groups, item) => {
    if (!groups[item.transaksi_id]) {
      groups[item.transaksi_id] = {
        transaksi_id: item.transaksi_id,
        nama_anggota: item.nama_anggota,
        metode_pembayaran: item.metode_pembayaran,
        items: [],
      };
    }
    groups[item.transaksi_id].items.push(item);
    return groups;
  }, {});

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatTanggal = useCallback((tanggal) => {
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage("");
  }, []);

  // Tambahkan CSS animation untuk notifikasi
  const notificationStyles = `
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
  `;

  if (isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Memuat dashboard kasir...</p>
          {!isAudioReady && (
            <p className="text-sm text-slate-500 mt-2">
              Menyiapkan audio notifikasi...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061226] via-[#0b1220] to-[#07102a] py-4 px-3 sm:px-4">
      {/* Inject CSS animations */}
      <style>{notificationStyles}</style>

      {/* Notification Popups */}
      {notifications.map((notification) => (
        <NotificationPopup
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

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
              Dashboard Kasir
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Selamat datang, {user?.username || "Kasir"}! Kelola transaksi dengan mudah
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-300">
              Status: <span className="font-medium text-green-400">Aktif</span>
            </div>
            <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
              🔄 {formatTime(lastUpdate)}
            </div>
            {!isAudioReady && (
              <div className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                🔊 Klik untuk aktifkan suara
              </div>
            )}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-500/20 rounded-xl">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-green-400"
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
                <p className="text-sm font-medium text-slate-400">
                  Total Penjualan Hari Ini
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {formatCurrency(stats.totalPenjualanHariIni)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-500/20 rounded-xl">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400"
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
                <p className="text-sm font-medium text-slate-400">
                  Total Transaksi Hari Ini
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {stats.totalTransaksiHariIni}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-4 sm:p-6">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-slate-400">
                  Hutang Belum Lunas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {formatCurrency(stats.hutangBelumLunas)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-red-500/20 rounded-xl">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-slate-400">
                  Stok Menipis
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {stats.stokMenipis}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Utama Kasir */}
        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <svg
                className="w-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Menu Utama Kasir
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <Link
                to="/kasir/input-penjualan"
                className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-indigo-500 hover:to-indigo-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-indigo-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">
                    Input Penjualan
                  </span>
                </div>
              </Link>

              <Link
                to="/kasir/pembayaran-hutang"
                className="bg-gradient-to-br from-green-600 to-green-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-green-500 hover:to-green-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-green-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
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
                  <span className="font-medium text-sm sm:text-base">
                    Bayar Hutang
                  </span>
                </div>
              </Link>

              <Link
                to="/kasir/opname-stok"
                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-blue-500 hover:to-blue-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-blue-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
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
                  <span className="font-medium text-sm sm:text-base">
                    Opname Stok
                  </span>
                </div>
              </Link>

              <Link
                to="/kasir/setor-admin"
                className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-amber-500 hover:to-amber-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-amber-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
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
                  <span className="font-medium text-sm sm:text-base">
                    Setor Admin
                  </span>
                </div>
              </Link>

              <Link
                to="/kasir/tarik-tunai"
                className="bg-gradient-to-br from-rose-600 to-rose-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-rose-500 hover:to-rose-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-rose-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">
                    Tarik Tunai
                  </span>
                </div>
              </Link>

              <Link
                to="/kasir/history"
                className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-3 sm:p-4 rounded-xl shadow-md hover:from-purple-500 hover:to-purple-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center border border-purple-500"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mb-2"
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
                  <span className="font-medium text-sm sm:text-base">
                    Riwayat
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Pesanan Anggota Section */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <svg
                    className="w-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  Pesanan Anggota
                </h2>
                <p className="text-indigo-200 text-xs sm:text-sm">
                  {orders.length} pesanan menunggu •{" "}
                  {Object.keys(groupedCart).length} dalam proses
                </p>
              </div>

              <div className="overflow-hidden">
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-slate-500 text-4xl mb-2">📦</div>
                    <p className="text-slate-400 text-sm">
                      Tidak ada pesanan baru
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Pesanan dari anggota akan muncul di sini
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 sm:p-4 max-h-[500px] overflow-y-auto">
                    {orders.map((tr) => (
                      <div
                        key={tr.transaksi_id}
                        className="bg-slate-700/40 p-3 sm:p-4 rounded-xl border border-slate-600/40 backdrop-blur-sm hover:border-slate-500/60 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm sm:text-base">
                              {tr.nama_anggota}
                            </p>
                            <p className="text-slate-400 text-xs sm:text-sm">
                              Metode:{" "}
                              <span className="capitalize text-slate-300">
                                {tr.metode_pembayaran}
                              </span>
                            </p>
                          </div>
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs sm:text-sm border border-blue-500/30">
                            {formatCurrency(tr.total_harga)}
                          </span>
                        </div>

                        <div className="mb-3 space-y-1">
                          {tr.items.map((item) => (
                            <div
                              key={item.barang_id}
                              className="text-slate-300 text-xs sm:text-sm flex justify-between"
                            >
                              <span className="truncate flex-1 mr-2">
                                {item.nama_item} × {item.jumlah}
                              </span>
                              <span className="flex-shrink-0">
                                {formatCurrency(item.harga_jual * item.jumlah)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => tambahKeCart(tr)}
                          disabled={cart.some(
                            (c) => c.transaksi_id === tr.transaksi_id
                          )}
                          className={`w-full rounded-xl py-2 px-3 text-sm font-medium transition-all ${
                            cart.some((c) => c.transaksi_id === tr.transaksi_id)
                              ? "bg-slate-600 text-slate-400 cursor-not-allowed border border-slate-500"
                              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 border border-indigo-500"
                          }`}
                        >
                          {cart.some((c) => c.transaksi_id === tr.transaksi_id)
                            ? "Sudah di Keranjang"
                            : "Tambah ke Proses"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sedang di Proses Section */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl sticky top-4">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <svg
                    className="w-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Sedang di Proses
                </h2>
                <p className="text-emerald-200 text-xs sm:text-sm">
                  {Object.keys(groupedCart).length} transaksi
                </p>
              </div>

              <div className="p-3 sm:p-4">
                {Object.keys(groupedCart).length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-slate-500 text-3xl mb-2">🛒</div>
                    <p className="text-slate-400 text-sm">Keranjang kosong</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Tambahkan pesanan dari kolom kiri
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto">
                    {Object.values(groupedCart).map((group) => (
                      <div
                        key={group.transaksi_id}
                        className="bg-slate-700/40 p-3 sm:p-4 rounded-xl border border-slate-600/40 backdrop-blur-sm"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm sm:text-base">
                              {group.nama_anggota}
                            </p>
                            <p className="text-slate-400 text-xs sm:text-sm capitalize">
                              {group.metode_pembayaran}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              hapusTransaksiDariCart(group.transaksi_id)
                            }
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20 transition-colors"
                            title="Hapus transaksi dari keranjang"
                          >
                            Hapus
                          </button>
                        </div>

                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <div
                              key={`${group.transaksi_id}-${item.barang_id}`}
                              className="flex justify-between items-center bg-slate-600/50 p-2 sm:p-3 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {item.nama_item}
                                </p>
                                <p className="text-slate-300 text-xs">
                                  {formatCurrency(item.harga_jual)}/pcs
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 ml-2">
                                <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-700 rounded-lg px-2 py-1">
                                  <button
                                    onClick={() =>
                                      updateCartItem(
                                        item.barang_id,
                                        group.transaksi_id,
                                        item.jumlah - 1
                                      )
                                    }
                                    className="w-5 h-5 sm:w-6 sm:h-6 rounded text-white text-xs hover:bg-slate-600 transition-colors flex items-center justify-center border border-slate-600"
                                  >
                                    −
                                  </button>
                                  <span className="text-white text-xs sm:text-sm w-6 text-center font-medium">
                                    {item.jumlah}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateCartItem(
                                        item.barang_id,
                                        group.transaksi_id,
                                        item.jumlah + 1
                                      )
                                    }
                                    className="w-5 h-5 sm:w-6 sm:h-6 rounded text-white text-xs hover:bg-slate-600 transition-colors flex items-center justify-center border border-slate-600"
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  onClick={() =>
                                    hapusCartItem(
                                      item.barang_id,
                                      group.transaksi_id
                                    )
                                  }
                                  className="text-red-400 hover:text-red-300 text-sm p-1"
                                  title="Hapus item"
                                >
                                  <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-slate-600/40 pt-3 mt-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-slate-300 text-sm sm:text-base">
                          Total:
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-emerald-400">
                          {formatCurrency(hitungTotal())}
                        </span>
                      </div>
                      <button
                        onClick={tandaiSelesai}
                        disabled={
                          processing || Object.keys(groupedCart).length === 0
                        }
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2 sm:py-3 font-semibold text-white transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 text-sm sm:text-base border border-emerald-500"
                      >
                        {processing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Memproses...
                          </>
                        ) : (
                          `Selesaikan ${
                            Object.keys(groupedCart).length
                          } Transaksi`
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaksi Terbaru Section */}
        <div className="bg-gradient-to-tr from-slate-800/60 to-slate-900/70 backdrop-blur-lg border border-slate-700/40 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <svg
                className="w-4 w-4 sm:h-5 sm:w-5"
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
              Transaksi Terbaru
            </h2>
            <p className="text-purple-200 text-xs sm:text-sm">
              {recentTransactions.length} transaksi terbaru
            </p>
          </div>

          <div className="p-3 sm:p-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 text-4xl mb-2">📄</div>
                <p className="text-slate-400 text-sm">Belum ada transaksi</p>
                <p className="text-slate-500 text-xs mt-1">
                  Transaksi yang diproses akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600/40">
                  <thead className="bg-slate-700/40">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Anggota
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600/40">
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm font-medium text-white">
                          #{transaction.id}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm text-slate-300">
                          {transaction.nama_anggota || "Non-Anggota"}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm text-slate-300">
                          {formatTanggal(transaction.tanggal)}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm font-medium text-white">
                          {formatCurrency(transaction.total)}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                              transaction.status === "selesai"
                                ? "bg-green-900/50 text-green-300 border-green-500/30"
                                : transaction.status === "pending"
                                ? "bg-yellow-900/50 text-yellow-300 border-yellow-500/30"
                                : "bg-red-900/50 text-red-300 border-red-500/30"
                            }`}
                          >
                            {transaction.status?.charAt(0).toUpperCase() +
                              transaction.status?.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}