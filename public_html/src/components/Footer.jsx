// src/components/Footer.jsx - With Icon
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900/80 border-t border-slate-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4 text-center">
        <p className="text-slate-400 text-sm">
          © {currentYear} <span className="text-blue-400 font-semibold">Nurdiansyah</span> • Koperasi Digital
        </p>
        <p className="text-slate-500 text-xs mt-1 flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Sistem Manajemen Modern
        </p>
      </div>
    </footer>
  );
}