import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { removeToken } from '../utils/api';

export default function NavbarMarketplace({ user, onSearch }) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchValue);
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Logo / Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/belanja')}>
            <div className="bg-white p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">Koperasi</span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <input
              type="text"
              placeholder="Cari produk di Koperasi..."
              className="w-full pl-4 pr-10 py-2 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button type="submit" className="absolute right-1 top-1 bottom-1 bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-md transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Cart */}
            <button
              onClick={() => navigate('/cart')}
              className="relative text-white hover:text-orange-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full border border-orange-500">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile / Menu */}
            <div className="relative group">
              <div className="flex items-center gap-2 text-white cursor-pointer py-2">
                <div className="w-8 h-8 bg-orange-700/30 rounded-full flex items-center justify-center border border-white/20">
                  <span className="text-sm font-semibold">{user?.username?.charAt(0).toUpperCase()}</span>
                </div>
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block transform transition-all origin-top-right z-50">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-bold text-gray-800 truncate">{user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => navigate('/profil')}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-2"
                  >
                    <span>👤</span> Profil Saya
                  </button>
                  <button
                    onClick={() => navigate('/riwayat')}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-2"
                  >
                    <span>📜</span> Riwayat Belanja
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      // Force manual token removal to be 100% sure
                      localStorage.removeItem('token');
                      localStorage.removeItem('dev_token');
                      sessionStorage.removeItem('token');
                      sessionStorage.removeItem('dev_token');

                      // Force hard redirect
                      window.location.href = '/#/login';
                      window.location.reload();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <span>🚪</span> Keluar (Logout)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
