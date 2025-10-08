import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar({ user, setUser }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => setUser(null);

  // Tentukan menu items berdasarkan role
  const getMenuItems = () => {
    switch (user.role) {
      case "kasir":
        return [
          { label: "Review Opname", to: "/kasir/review-opname" }, // Tetap dipertahankan
        ];
      case "admin":
        return [
          { label: "Dashboard", to: "/dashboard" },
          { label: "Monitor Barang", to: "/monitor-barang" },
        ];
      case "anggota":
        return [
          { label: "Belanja", to: "/belanja" },
          { label: "Riwayat", to: "/riwayat" },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/Logo.svg" alt="Logo" className="h-10 w-10" />
            <span className="font-bold text-gray-800 text-lg">
              Koperasi PK Batam
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-indigo-50"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User info */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-gray-800 font-medium">
              {user.username || user.nama_user}
            </span>
            <Link
              to="/profil"
              className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"
            >
              Profil
            </Link>
            <button
              onClick={handleLogout}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500 transition-colors duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg border-t">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 font-medium py-3 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200 border-b border-gray-100"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 mt-2 pt-3">
              <div className="px-3 py-2">
                <span className="block text-gray-800 font-medium text-sm">
                  User: {user.username || user.nama_user}
                </span>
              </div>
              <Link
                to="/profil"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 font-medium py-3 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
              >
                Profil
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full text-left bg-indigo-600 text-white py-3 px-3 rounded-lg hover:bg-indigo-500 transition-colors duration-200 font-medium mt-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
