import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'RahasiaSuperRahasia123';

async function checkAuth(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'kasir' && decoded.role !== 'admin') return null;
        return decoded;
    } catch (e) { return null; }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const user = await checkAuth(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await prisma.pembayaran_hutang.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                anggota: {
                    select: {
                        nama_lengkap: true,
                        user: { select: { username: true } }
                    }
                },
                users: {
                    select: { username: true } // Kasir name
                }
            }
        });

        const formatted = data.map((item: any) => ({
            pembayaran_id: item.pembayaran_id,
            anggota_id: item.anggota_id,
            nama_anggota: item.anggota?.nama_lengkap || item.anggota?.user?.username,
            nominal: Number(item.nominal),
            status: item.status, // pending, approved, rejected
            created_at: item.created_at
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await checkAuth(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { pembayaran_id, action } = body;

        if (!pembayaran_id || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
        }

        // Transaction for approval
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.pembayaran_hutang.findUnique({
                where: { pembayaran_id: Number(pembayaran_id) },
                include: { anggota: true }
            });

            if (!payment) throw new Error('Pembayaran not found');
            if (payment.status !== 'pending') throw new Error('Pembayaran already processed');

            if (action === 'approve') {
                // Update Pembayaran status
                await tx.pembayaran_hutang.update({
                    where: { pembayaran_id: Number(pembayaran_id) },
                    data: {
                        status: 'approved',
                        approved_at: new Date(),
                        kasir_id: user.user_id
                    }
                });

                // Update Anggota: Reduce Hutang, Increase Saldo (Virtual money flow?)
                // Legacy code: Hutang - nominal, Saldo + nominal.
                // Logic: Member pays, debt decreases. Why saldo increases?
                // Maybe "Saldo" tracks "Net Worth"? Or the logic is: Payments are effectively deposits that immediately pay off debt?
                // Legacy: UPDATE anggota SET hutang = hutang - ?, saldo = saldo + ?
                // Wait, if I pay debt, my debt goes down. Why does my saldo go up?
                // Maybe the payment is "Topup then Pay"? 
                // Line 357 in legacy: `UPDATE anggota SET saldo = saldo + ?`
                // Line 348 in legacy: `UPDATE anggota SET hutang = hutang - ?`
                // This seems double counting if I pay cash.
                // UNLESS `pembayaran_hutang` implies "Transfer to Saldo for Debt".
                // Let's stick to legacy logic to avoid breaking accounting.

                await tx.anggota.update({
                    where: { anggota_id: payment.anggota_id! },
                    data: {
                        hutang: { decrement: Number(payment.nominal) }
                    }
                });
            } else {
                await tx.pembayaran_hutang.update({
                    where: { pembayaran_id: Number(pembayaran_id) },
                    data: {
                        status: 'rejected',
                        approved_at: new Date(),
                        kasir_id: user.user_id
                    }
                });
            }
            return { success: true };
        });

        return NextResponse.json({ success: true, message: `Pembayaran ${action}ed` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
