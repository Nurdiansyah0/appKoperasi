'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { History, ShoppingBag, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RiwayatPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res: any = await api.get('/anggota/history');
            if (res.success) {
                setHistory(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'selesai': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'on_process': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'batal': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Memuat riwayat transaksi...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
                <p className="text-slate-500">Daftar semua belanjaan Anda.</p>
            </div>

            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
                        <History size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400">Belum ada riwayat transaksi.</p>
                    </div>
                ) : (
                    history.map((item, index) => (
                        <motion.div
                            key={item.transaksi_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">
                                        {item.items?.[0]?.nama_barang}
                                        {item.items?.length > 1 && ` + ${item.items.length - 1} lainnya`}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                                        ID: {item.transaksi_id} • {new Date(item.created_at).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                                <p className="font-black text-slate-800">Rp {Number(item.total_harga).toLocaleString('id-ID')}</p>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${getStatusStyle(item.status)}`}>
                                    {item.status.replace('_', ' ')}
                                </span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
