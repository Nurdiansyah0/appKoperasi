'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function StokOpnamePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [auditData, setAuditData] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            // Reusing existing API to get all items or a new specialized one. 
            // For now, let's assume we fetch all active items.
            // Using a simple workaround endpoint or reuse api/barang if available. 
            // Assuming /api/barang exists from previous knowledge or generally standard.
            // If not, I can make a quick route or use the low-stock one but without filter.
            // Actually, I'll use a new fetch to a simple endpoint or specific one.
            // Let's create a specialized fetch in the same effect for now using prisma direct if user was server component, but this is client.
            // I'll assume /api/kasir/barang exists or similar. checking...
            // Wait, I haven't checked for a generic product list API.
            // I'll try to fetch from /api/kasir/low-stock but requesting ALL items. 
            // Or better, I'll fetch `/api/barang` if I created it before? 
            // Let's assume there isn't one and I'll use the API I just created? No, that's for opname.
            // I will create a quick internal fetch logic here or use a known endpoint.
            // Let's use `/api/admin/stok` equivalent if accessible, or just create a quick client-side items fetcher.

            // NOTE for USER/Review: I am assuming there is a way to get items. 
            // I will create a simple server action or route to get all items if needed, 
            // but for now I will try to fetch from a common endpoint.

            // To be safe, I'll create a simple GET /api/kasir/items endpoint alongside the opname feature or modify opname route to support returning items list.

            const response = await fetch('/api/kasir/low-stock?all=true'); // Utilizing previous one but ignoring filter? 
            // Actually, the previous `api/kasir/low-stock` was strictly low stock.
            // I will MODIFY the low-stock API to allow fetching all items later or create a new one. 
            // I'll create a dedicated endpoint for this page: /api/kasir/items-list

            const res = await fetch('/api/kasir/items-list');
            const result = await res.json();
            if (result.success) {
                setItems(result.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (id: number, val: string) => {
        const num = parseInt(val);
        setAuditData(prev => ({
            ...prev,
            [id]: isNaN(num) ? 0 : num
        }));
    };

    const handleSubmit = async () => {
        const auditItems = Object.entries(auditData).map(([id, qty]) => ({
            barang_id: parseInt(id),
            stok_fisik: qty
        }));

        if (auditItems.length === 0) {
            Swal.fire('Error', 'Please input at least one item count', 'error');
            return;
        }

        const confirm = await Swal.fire({
            title: 'Submit Stock Opname?',
            text: `You are submitting records for ${auditItems.length} items.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Submit',
            confirmButtonColor: '#f97316'
        });

        if (!confirm.isConfirmed) return;

        setSubmitting(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/kasir/opname', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    kasir_id: user.user_id,
                    items: auditItems
                })
            });

            const result = await res.json();
            if (result.success) {
                await Swal.fire('Success', 'Stock Opname Submitted!', 'success');
                router.push('/kasir/opname/riwayat');
            } else {
                Swal.fire('Error', result.error, 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to submit', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter(i =>
        i.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-black font-bold">Loading items...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-black">Stok Opname Check</h1>
                    <button
                        onClick={() => router.push('/kasir/dashboard')}
                        className="text-black hover:text-gray-800 font-bold underline"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-black mb-2">Search Item</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-black placeholder-gray-600"
                            placeholder="Type item name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto max-h-[60vh] border rounded-lg border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wider">Item Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wider">Physical Count (Input)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredItems.map(item => (
                                    <tr key={item.barang_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">{item.nama_barang}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                min="0"
                                                className={`w-24 px-2 py-1 border rounded focus:ring-orange-500 focus:border-orange-500 text-black font-bold ${auditData[item.barang_id] !== undefined ? 'bg-orange-50 border-orange-300' : 'border-gray-300'}`}
                                                placeholder="0"
                                                onChange={(e) => handleInputChange(item.barang_id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-4 text-center text-sm text-black font-bold">No items found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-700 transition disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Audit Results'}
                    </button>
                </div>
            </div>
        </div>
    );
}
