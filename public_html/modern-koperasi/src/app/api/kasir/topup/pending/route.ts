import { NextResponse } from 'next/server';
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

export const dynamic = 'force-dynamic';

// GET: List pending topup requests
export async function GET(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const requests = await prisma.topup_request.findMany({
            where: { status: 'pending' },
            include: {
                anggota: {
                    select: {
                        nama_lengkap: true,
                        saldo: true
                    }
                }
            },
            orderBy: { created_at: 'asc' }
        });

        const formatted = requests.map((r: any) => ({
            ...r,
            nominal: Number(r.nominal),
            anggota: {
                nama_lengkap: r.anggota?.nama_lengkap,
                saldo: Number(r.anggota?.saldo)
            }
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching topup requests:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Approve or reject topup request
export async function POST(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { topup_id, action } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const topupRequest = await tx.topup_request.findUnique({
                where: { topup_id: Number(topup_id) },
                include: { anggota: true }
            });

            if (!topupRequest) throw new Error('Request not found');
            if (topupRequest.status !== 'pending') throw new Error('Request already processed');

            if (action === 'approve') {
                // Update request status
                await tx.topup_request.update({
                    where: { topup_id: Number(topup_id) },
                    data: {
                        status: 'approved',
                        approved_at: new Date(),
                        kasir_id: user.user_id
                    }
                });

                // Increment member's saldo
                await tx.anggota.update({
                    where: { anggota_id: topupRequest.anggota_id! },
                    data: {
                        saldo: { increment: Number(topupRequest.nominal) }
                    }
                });
            } else {
                await tx.topup_request.update({
                    where: { topup_id: Number(topup_id) },
                    data: {
                        status: 'rejected',
                        approved_at: new Date(),
                        kasir_id: user.user_id
                    }
                });
            }

            return { success: true };
        });

        return NextResponse.json({ success: true, message: `Topup ${action}ed successfully` });
    } catch (error: any) {
        console.error('Error processing topup:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
