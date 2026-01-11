'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function RiwayatOpnamePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [opnames, setOpnames] = useState<any[]>([]);
    const [selectedOpname, setSelectedOpname] = useState<any>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/kasir/opname?limit=50', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setOpnames(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch opname history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading history...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-black">Riwayat Stok Opname</h1>
                    <button
                        onClick={() => router.push('/kasir/dashboard')}
                        className="text-black hover:text-gray-800 font-bold underline"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wider">Auditor (Kasir)</th>
                                <th className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wider">Total Items Checked</th>
                                <th className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wider">Discrepancies found</th>
                                <th className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {opnames.map((op) => {
                                const discrepancyCount = op.details.filter((d: any) => d.selisih !== 0).length;
                                return (
                                    <tr key={op.opname_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-semibold">#{op.opname_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium">
                                            {new Date(op.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">{op.users?.username || 'Unknown'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-semibold">{op.details.length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${discrepancyCount > 0 ? 'bg-red-200 text-red-900 border border-red-400' : 'bg-green-200 text-green-900 border border-green-400'}`}>
                                                {discrepancyCount} items
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedOpname(op)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {opnames.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detail Modal */}
                {selectedOpname && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-xl font-black text-black">Audit Details #{selectedOpname.opname_id}</h2>
                                    <p className="text-sm text-black font-medium">Performed by {selectedOpname.users?.username} on {new Date(selectedOpname.created_at).toLocaleString('id-ID')}</p>
                                </div>
                                <button onClick={() => setSelectedOpname(null)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="bg-white border-b-2 border-black">
                                            <th className="px-4 py-2 text-left text-xs font-black text-black uppercase">Item</th>
                                            <th className="px-4 py-2 text-center text-xs font-black text-black uppercase">System Stock</th>
                                            <th className="px-4 py-2 text-center text-xs font-black text-black uppercase">Physical Count</th>
                                            <th className="px-4 py-2 text-right text-xs font-black text-black uppercase">Difference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedOpname.details.map((d: any) => (
                                            <tr key={d.detail_id} className={d.selisih !== 0 ? 'bg-red-50' : ''}>
                                                <td className="px-4 py-2 text-sm font-bold text-black">{d.barang?.nama_barang}</td>
                                                <td className="px-4 py-2 text-sm text-center text-black font-bold">{d.stok_sistem}</td>
                                                <td className="px-4 py-2 text-sm text-center text-black font-black border-2 border-gray-200">{d.stok_fisik}</td>
                                                <td className={`px-4 py-2 text-sm text-right font-black ${d.selisih < 0 ? 'text-red-600' : d.selisih > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {d.selisih > 0 ? `+${d.selisih}` : d.selisih}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => setSelectedOpname(null)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
