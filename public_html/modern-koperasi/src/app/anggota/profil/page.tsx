'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { User, Wallet, PiggyBank, History, TrendingUp, CreditCard, ArrowRight, Shield, PenSquare } from 'lucide-react';
import Swal from 'sweetalert2';

interface Transaction {
    transaksi_id: number;
    total_harga: number;
    status: string;
    created_at: string;
    items: any[];
}

export default function ProfilPage() {
    const [data, setData] = useState<any>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        email: '',
        password: ''
    });

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const res = await api.put('/anggota/profil', editForm);
            if (res.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Profil berhasil diperbarui',
                    confirmButtonColor: '#f97316', // orange-500
                    timer: 2000
                });

                // Update local data
                setData({ ...data, email: editForm.email });
                setIsEditing(false);
                setEditForm({ email: '', password: '' });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: res.error || 'Gagal memperbarui profil',
                    confirmButtonColor: '#f97316'
                });
            }
        } catch (err) {
            console.error('Update failed:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Terjadi kesalahan saat menyimpan perubahan',
                confirmButtonColor: '#f97316'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profilRes, historyRes]: [any, any] = await Promise.all([
                    api.get('/anggota/profil'),
                    api.get('/anggota/history?limit=5')
                ]);

                if (profilRes.success) {
                    setData(profilRes.data);
                }

                // Handle history response structure - logs showed it returns 200 OK
                // Assuming it returns { success: true, data: [...] } or just the array depending on implementation
                // Based on standard API pattern in this app, likely { success: true, data: [...] }
                if (historyRes.success) {
                    setTransactions(historyRes.data);
                } else if (Array.isArray(historyRes)) {
                    setTransactions(historyRes);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
            {/* Header / Identity Card */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-inner">
                        <User size={48} className="text-white" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold mb-1">{data?.nama_lengkap || data?.username}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-orange-100">
                            <span className="bg-black/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                                {data?.role || 'ANGGOTA'}
                            </span>
                            <span className="text-sm border-l border-white/30 pl-2">
                                {data?.unit_kerja || 'Unit Tidak Diketahui'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 md:mt-0 md:ml-auto flex flex-col gap-2 min-w-[200px]">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                            <p className="text-xs text-orange-100 mb-1">Total Simpanan</p>
                            <p className="text-2xl font-bold">Rp {Number(data?.saldo || 0).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Saldo Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <Wallet size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Dompet</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Sisa Saldo Belanja</p>
                    <h3 className="text-2xl font-bold text-gray-800">Rp {Number(data?.saldo || 0).toLocaleString('id-ID')}</h3>
                </div>

                {/* Hutang Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Kewajiban</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Total Hutang</p>
                    <h3 className="text-2xl font-bold text-red-600">Rp {Number(data?.hutang || 0).toLocaleString('id-ID')}</h3>
                </div>

                {/* SHU Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Investasi</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Estimasi SHU</p>
                    <h3 className="text-2xl font-bold text-green-600">Rp {Number(data?.shu || 0).toLocaleString('id-ID')}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transaction History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <History size={20} className="text-orange-500" />
                                Riwayat Transaksi Terakhir
                            </h3>
                            <button className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                                Lihat Semua <ArrowRight size={14} />
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {transactions.length > 0 ? (
                                transactions.map((trx, idx) => (
                                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 
                                                ${trx.status === 'selesai' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                {trx.status === 'selesai' ? '✓' : '⟳'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 truncate max-w-[200px]">
                                                    {trx.items && trx.items.length > 0
                                                        ? `${trx.items[0].nama_barang} ${trx.items.length > 1 ? `(+${trx.items.length - 1} lainnya)` : ''}`
                                                        : 'Belanja Koperasi'
                                                    }
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(trx.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800">- Rp {Number(trx.total_harga).toLocaleString('id-ID')}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                                                ${trx.status === 'selesai' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                {trx.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400">
                                    <p>Belum ada riwayat transaksi.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Details */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Shield size={18} className="text-orange-500" />
                                Detail Akun
                            </h3>
                            {!isEditing && (
                                <button
                                    onClick={() => {
                                        setEditForm({
                                            email: data?.email || '',
                                            password: ''
                                        });
                                        setIsEditing(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                                    title="Edit Profil"
                                >
                                    <PenSquare size={18} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Username</p>
                                <p className="font-bold text-slate-800">{data?.username}</p>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Jabatan</p>
                                <p className="font-bold text-slate-800">{data?.jabatan || '-'}</p>
                            </div>

                            {isEditing ? (
                                <>
                                    <div className="p-3 bg-white border-2 border-orange-100 rounded-xl shadow-sm">
                                        <label className="text-xs text-orange-600 font-bold mb-1 block">Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full text-sm font-bold text-slate-800 bg-transparent outline-none border-b border-orange-200 focus:border-orange-500 py-1"
                                            placeholder="Masukkan email..."
                                        />
                                    </div>
                                    <div className="p-3 bg-white border-2 border-orange-100 rounded-xl shadow-sm">
                                        <label className="text-xs text-orange-600 font-bold mb-1 block">Password Baru</label>
                                        <input
                                            type="password"
                                            value={editForm.password}
                                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                            className="w-full text-sm font-bold text-slate-800 bg-transparent outline-none border-b border-orange-200 focus:border-orange-500 py-1"
                                            placeholder="Kosongkan jika tidak ubah"
                                        />
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 py-2 rounded-lg text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={loading}
                                            className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition shadow-md shadow-orange-200"
                                        >
                                            {loading ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-1">Email</p>
                                    <p className="font-bold text-slate-800 break-all">{data?.email || '-'}</p>
                                </div>
                            )}

                            {!isEditing && (
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-1">Status Keanggotaan</p>
                                    <p className="font-bold text-green-600 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                                        Aktif
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
