import { useState } from "react";
import { api } from "../utils/api";

export default function TarikTunaiPage() {
  const [loading, setLoading] = useState(false);
  
  // Implementasi form tarik tunai di sini
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/80 rounded-2xl shadow-xl p-6 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-6">Tarik Tunai Anggota</h1>
          {/* Implementasi form tarik tunai */}
          <p className="text-slate-400 text-center py-8">Fitur tarik tunai akan segera tersedia</p>
        </div>
      </div>
    </div>
  );
}