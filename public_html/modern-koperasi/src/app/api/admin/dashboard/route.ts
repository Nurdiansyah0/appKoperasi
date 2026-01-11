import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'RahasiaSuperRahasia123';

async function checkAdmin(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return null;
        return decoded;
    } catch (e) {
        return null;
    }
}

export async function GET(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // serialize BigInt to Number for JSON
        const serializeData = (data: any) => {
            return JSON.parse(JSON.stringify(data, (key, value) =>
                typeof value === 'bigint' ? Number(value) : value
            ));
        };

        const [
            totalAnggota,
            totalKasir,
            stokMenipis,
            dailyStats,
            topSellingItems,
            salesTrend,
            cashierKPI
        ] = await Promise.all([
            prisma.anggota.count(),
            prisma.users.count({ where: { role: 'kasir' } }),
            prisma.barang.count({ where: { stok: { lte: 5 } } }),
            prisma.transaksi.aggregate({
                where: {
                    created_at: { gte: today },
                    status: 'selesai'
                },
                _sum: {
                    total_harga: true
                },
                _count: {
                    transaksi_id: true
                }
            }),
            prisma.$queryRaw`
                SELECT b.nama_barang, SUM(td.jumlah) as total_sold, b.stok
                FROM transaksi_detail td
                JOIN barang b ON td.barang_id = b.barang_id
                JOIN transaksi t ON td.transaksi_id = t.transaksi_id
                WHERE t.status = 'selesai' AND t.created_at >= ${thirtyDaysAgo}
                GROUP BY td.barang_id, b.nama_barang, b.stok
                ORDER BY total_sold DESC
                LIMIT 5
            `,
            prisma.$queryRaw`
                SELECT DATE_FORMAT(t.created_at, '%Y-%m-%d') as date, SUM(td.jumlah) as total_items
                FROM transaksi_detail td
                JOIN transaksi t ON td.transaksi_id = t.transaksi_id
                WHERE t.status = 'selesai' AND t.created_at >= ${thirtyDaysAgo}
                GROUP BY DATE_FORMAT(t.created_at, '%Y-%m-%d')
                ORDER BY date ASC
            `,
            prisma.$queryRaw`
                SELECT u.username, COUNT(t.transaksi_id) as total_transactions, SUM(t.total_harga) as total_revenue
                FROM transaksi t
                JOIN users u ON t.kasir_id = u.user_id
                WHERE t.status = 'selesai' AND t.created_at >= ${thirtyDaysAgo}
                GROUP BY t.kasir_id, u.username
                ORDER BY total_revenue DESC
            `
        ]);

        // Restock suggestions: Items with low stock but high sales velocity
        const restockSuggestions: any = await prisma.$queryRaw`
             SELECT b.nama_barang, b.stok, SUM(td.jumlah) as sold_last_30_days
             FROM transaksi_detail td
             JOIN barang b ON td.barang_id = b.barang_id
             JOIN transaksi t ON td.transaksi_id = t.transaksi_id
             WHERE t.status = 'selesai' AND t.created_at >= ${thirtyDaysAgo}
             GROUP BY td.barang_id, b.nama_barang, b.stok
             HAVING b.stok < 10 AND sold_last_30_days > 5
             ORDER BY sold_last_30_days DESC
             LIMIT 5
        `;

        return NextResponse.json({
            success: true,
            data: {
                total_anggota: totalAnggota,
                total_kasir: totalKasir,
                stok_menipis: stokMenipis,
                pendapatan_hari_ini: Number(dailyStats._sum.total_harga || 0),
                transaksi_hari_ini: dailyStats._count.transaksi_id,
                top_selling: serializeData(topSellingItems),
                sales_trend: serializeData(salesTrend),
                cashier_kpi: serializeData(cashierKPI),
                restock_suggestions: serializeData(restockSuggestions)
            }
        });

    } catch (error: any) {
        console.error('Admin Dashboard error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
