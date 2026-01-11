'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Distribution {
    shu_id: number;
    tahun: number;
    anggota: {
        user: { username: string };
    };
    shu_60_percent: number;
    shu_30_percent: number;
    shu_10_percent: number;
    created_at: string;
}

export default function AdminSHUPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDistributions = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/admin/shu', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setDistributions(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch distributions:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDistributions();
    }, []);

    // Group distributions by year
    const groupedByYear = distributions.reduce((acc: any, dist) => {
        const year = dist.tahun;
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(dist);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white shadow mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">SHU Distribution History</h1>
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">Automatic SHU Distribution</h3>
                            <p className="text-sm text-blue-800 mb-3">
                                SHU (Sisa Hasil Usaha) is automatically distributed to members when they purchase items.
                                This page shows the complete history of all SHU distributions.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                                <p className="text-sm font-semibold text-blue-900 mb-2">Distribution Formula:</p>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• <strong>60%</strong> of profit → Added to member's SHU balance immediately</li>
                                    <li>• <strong>30%</strong> of profit → Recorded for cooperative reserves</li>
                                    <li>• <strong>10%</strong> of profit → Recorded for other allocations</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distribution History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Transaction-Based SHU Records</h2>
                        <p className="text-sm text-gray-600 mt-1">Every completed member transaction generates an SHU distribution entry</p>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <p className="text-center text-gray-500 py-8">Loading...</p>
                        ) : Object.keys(groupedByYear).length > 0 ? (
                            <div className="space-y-6">
                                {Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a)).map((year) => (
                                    <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-900">Year {year}</h3>
                                            <p className="text-sm text-gray-600">
                                                Total SHU (60% to members): Rp {groupedByYear[year].reduce((sum: number, d: Distribution) =>
                                                    sum + Number(d.shu_60_percent), 0
                                                ).toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {groupedByYear[year].length} transaction{groupedByYear[year].length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">60% (Member)</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">30% (Reserve)</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">10% (Other)</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Profit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {groupedByYear[year].map((dist: Distribution) => (
                                                        <tr key={dist.shu_id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {dist.anggota?.user?.username || 'Unknown'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Date(dist.created_at).toLocaleDateString('id-ID')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                                Rp {Number(dist.shu_60_percent).toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                Rp {Number(dist.shu_30_percent).toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                Rp {Number(dist.shu_10_percent).toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                Rp {(Number(dist.shu_60_percent) + Number(dist.shu_30_percent) + Number(dist.shu_10_percent)).toLocaleString('id-ID')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500">No SHU distributions yet.</p>
                                <p className="text-sm text-gray-400 mt-2">SHU will appear here when members make purchases.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
