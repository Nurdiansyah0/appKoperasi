'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/context/AuthContext';

interface Transaction {
    transaksi_id: number;
    created_at: string;
    users: { username: string };
    total_harga: number;
    total_keuntungan: number;
    status: string;
}

interface Summary {
    totalRevenue: number;
    totalProfit: number;
    totalTransactions: number;
}

export default function AdminLaporanPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalRevenue: 0,
        totalProfit: 0,
        totalTransactions: 0
    });

    // Date Filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // Start of current month
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0]; // Today
    });

    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const query = new URLSearchParams({ startDate, endDate }).toString();
            const response = await fetch(`/api/admin/laporan?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                setTransactions(result.data.transactions);
                setSummary(result.data.summary);
            }
        } catch (error) {
            console.error('Failed to fetch report:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Koperasi PK Batam - Laporan Penjualan', 14, 20);

        doc.setFontSize(12);
        doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 30);
        doc.text(`Dicetak oleh: ${user?.username}`, 14, 36);

        // Summary
        doc.text(`Total Omset: Rp ${summary.totalRevenue.toLocaleString('id-ID')}`, 14, 45);
        doc.text(`Total Keuntungan: Rp ${summary.totalProfit.toLocaleString('id-ID')}`, 14, 51);
        doc.text(`Total Transaksi: ${summary.totalTransactions}`, 14, 57);

        // Table
        const tableColumn = ["ID", "Tanggal", "Kasir", "Total Belanja", "Keuntungan"];
        const tableRows: any[] = [];

        transactions.forEach(t => {
            const transactionData = [
                t.transaksi_id,
                new Date(t.created_at).toLocaleDateString('id-ID'),
                t.users?.username || 'Unknown',
                `Rp ${Number(t.total_harga).toLocaleString('id-ID')}`,
                `Rp ${Number(t.total_keuntungan).toLocaleString('id-ID')}`,
            ];
            tableRows.push(transactionData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
        });

        doc.save(`Laporan_Penjualan_${startDate}_to_${endDate}.pdf`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white shadow mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Filters */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Filter Data
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={transactions.length === 0}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                        Export PDF
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600">Total Omset</p>
                        <p className="text-2xl font-bold text-blue-600">
                            Rp {summary.totalRevenue.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600">Total Keuntungan</p>
                        <p className="text-2xl font-bold text-green-600">
                            Rp {summary.totalProfit.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600">Total Transaksi</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {summary.totalTransactions}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Transaction History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading data...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.length > 0 ? (
                                        transactions.map((t) => (
                                            <tr key={t.transaksi_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{t.transaksi_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(t.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {t.users?.username || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    Rp {Number(t.total_harga).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                    Rp {Number(t.total_keuntungan).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {t.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                No transactions found in this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
