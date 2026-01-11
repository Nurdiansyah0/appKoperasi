import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'RahasiaSuperRahasia123';

async function checkAnggota(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'anggota') return null;
        return decoded;
    } catch (e) { return null; }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const user = await checkAnggota(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const anggota = await prisma.anggota.findFirst({
            where: { user_id: user.user_id }
        });

        if (!anggota) {
            return NextResponse.json({ success: false, error: 'Anggota not found' }, { status: 404 });
        }

        // Calculate 6-month date range
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Get all completed transactions in last 6 months
        const transactions = await prisma.transaksi.findMany({
            where: {
                anggota_id: anggota.anggota_id,
                status: 'selesai',
                created_at: {
                    gte: sixMonthsAgo
                }
            },
            select: {
                total_harga: true
            }
        });

        // Calculate total spending
        const totalSpending = transactions.reduce((sum, t) => sum + Number(t.total_harga), 0);

        // Calculate monthly average
        const monthlyAverage = totalSpending / 6;

        // Hutang limit = 1.5x monthly average
        const hutangLimit = monthlyAverage * 1.5;

        // Current hutang
        const currentHutang = Number(anggota.hutang);

        // Available credit
        const available = Math.max(0, hutangLimit - currentHutang);

        return NextResponse.json({
            success: true,
            data: {
                limit: Math.round(hutangLimit),
                current_hutang: currentHutang,
                available: Math.round(available),
                monthly_average: Math.round(monthlyAverage),
                total_spending_6months: Math.round(totalSpending)
            }
        });
    } catch (error) {
        console.error('Error calculating hutang limit:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
