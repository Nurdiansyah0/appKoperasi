import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'RahasiaSuperRahasia123';

async function checkKasir(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'kasir' && decoded.role !== 'admin') return null;
        return decoded;
    } catch (e) { return null; }
}

export async function GET(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const now = new Date();

        // Time Ranges
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        const day = startOfWeek.getDay() || 7; // Get current day number, make Sunday (0) -> 7
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); // Go back to Monday

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Time Ranges for Comparison
        const yesterdayStart = new Date(today);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(today);

        const lastWeekStart = new Date(startOfWeek);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(startOfWeek);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(startOfMonth);

        // Aggregations
        const [
            todayStats,
            weekStats,
            monthStats,
            yesterdayStats,
            lastWeekStats,
            lastMonthStats,
            totalPesanan,
            stokMenipis,
        ] = await Promise.all([
            // Today
            prisma.transaksi.aggregate({
                where: { created_at: { gte: today }, status: 'selesai' },
                _sum: { total_harga: true },
                _count: { transaksi_id: true }
            }),
            // Week
            prisma.transaksi.aggregate({
                where: { created_at: { gte: startOfWeek }, status: 'selesai' },
                _sum: { total_harga: true },
                _count: { transaksi_id: true }
            }),
            // Month
            prisma.transaksi.aggregate({
                where: { created_at: { gte: startOfMonth }, status: 'selesai' },
                _sum: { total_harga: true },
                _count: { transaksi_id: true }
            }),
            // Yesterday
            prisma.transaksi.aggregate({
                where: { created_at: { gte: yesterdayStart, lt: yesterdayEnd }, status: 'selesai' },
                _sum: { total_harga: true }
            }),
            // Last Week
            prisma.transaksi.aggregate({
                where: { created_at: { gte: lastWeekStart, lt: lastWeekEnd }, status: 'selesai' },
                _sum: { total_harga: true }
            }),
            // Last Month
            prisma.transaksi.aggregate({
                where: { created_at: { gte: lastMonthStart, lt: lastMonthEnd }, status: 'selesai' },
                _sum: { total_harga: true }
            }),
            // Pending Orders
            prisma.transaksi.count({
                where: { status: { in: ['pending', 'on_process'] as any } }
            }),
            // Low Stock
            prisma.barang.count({ where: { stok: { lte: 5 } } }),
        ]);

        // Process monthly trend manually if groupBy date is too granular
        // Prisma groupBy on date is exact timestamp. We need to group by Month.
        // Prisma doesn't support Date functions in groupBy directly easily without raw query.
        // Alternative: Fetch all completed transactions for last 6 months and aggregate in JS. 
        // For scalability, raw query is better, but for simplicity/safety with Prisma:
        // We will fetch simplified data for chart.

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 2);
        threeMonthsAgo.setDate(1);
        threeMonthsAgo.setHours(0, 0, 0, 0);

        const trendDataRaw = await prisma.transaksi.findMany({
            where: {
                status: 'selesai',
                created_at: { gte: threeMonthsAgo }
            },
            select: {
                created_at: true,
                total_harga: true
            }
        });

        // Group by Month in JS
        const monthlyData = new Map<string, number>();
        // Initialize last 3 months
        for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' }); // e.g. "Januari 2026"
            monthlyData.set(key, 0);
        }

        trendDataRaw.forEach(t => {
            const key = new Date(t.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            if (monthlyData.has(key)) {
                monthlyData.set(key, (monthlyData.get(key) || 0) + Number(t.total_harga));
            }
        });

        // Convert map to array { label, value } reversed (oldest first)
        const trend = Array.from(monthlyData.entries()).map(([label, value]) => ({ label, value })).reverse();

        // Calculate Growth Percentages
        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return NextResponse.json({
            success: true,
            data: {
                pendapatan_hari_ini: Number(todayStats._sum.total_harga || 0),
                growth_hari_ini: calculateGrowth(Number(todayStats._sum.total_harga || 0), Number(yesterdayStats._sum.total_harga || 0)),

                pendapatan_minggu_ini: Number(weekStats._sum.total_harga || 0),
                growth_minggu_ini: calculateGrowth(Number(weekStats._sum.total_harga || 0), Number(lastWeekStats._sum.total_harga || 0)),

                pendapatan_bulan_ini: Number(monthStats._sum.total_harga || 0),
                growth_bulan_ini: calculateGrowth(Number(monthStats._sum.total_harga || 0), Number(lastMonthStats._sum.total_harga || 0)),

                total_pesanan: totalPesanan,
                stok_menipis: stokMenipis,
                trend_bulanan: trend
            }
        });

    } catch (error: any) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
