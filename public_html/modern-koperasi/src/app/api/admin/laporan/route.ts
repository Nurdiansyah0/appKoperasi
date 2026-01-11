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

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to current month start and end if not provided
    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);

    // For end date, we want the end of the day. If param is provided, use end of that day.
    // Default is end of current day.
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999);

    try {
        const transactions = await prisma.transaksi.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'selesai'
            },
            include: {
                users: { // Kasir
                    select: { username: true }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Calculate summaries
        const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total_harga || 0), 0);
        const totalProfit = transactions.reduce((sum, t) => sum + Number(t.total_keuntungan || 0), 0);
        const totalTransactions = transactions.length;

        // Serialize decimals/bigints
        const serializeData = (data: any) => {
            return JSON.parse(JSON.stringify(data, (key, value) =>
                typeof value === 'bigint' ? Number(value) : value
            ));
        };

        return NextResponse.json({
            success: true,
            data: {
                transactions: serializeData(transactions),
                summary: {
                    totalRevenue,
                    totalProfit,
                    totalTransactions
                }
            }
        });

    } catch (error) {
        console.error('Report API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
