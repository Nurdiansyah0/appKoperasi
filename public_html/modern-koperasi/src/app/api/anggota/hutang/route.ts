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
    } catch (e) {
        return null;
    }
}

export async function GET(request: Request) {
    const user = await checkAnggota(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        // Fetch current debt and payment history
        const anggota = await prisma.anggota.findUnique({
            where: { user_id: user.user_id },
            select: { anggota_id: true, hutang: true }
        });

        if (!anggota) return NextResponse.json({ success: false, error: 'Anggota not found' }, { status: 404 });

        const history = await prisma.pembayaran_hutang.findMany({
            where: { anggota_id: anggota.anggota_id },
            orderBy: { created_at: 'desc' },
            take: 20
        });

        // Serialize Decimal to Number
        const currentHutang = Number(anggota.hutang);
        const serializedHistory = history.map(h => ({
            ...h,
            nominal: Number(h.nominal)
        }));

        return NextResponse.json({
            success: true,
            data: {
                current_hutang: currentHutang,
                history: serializedHistory
            }
        });

    } catch (error) {
        console.error('Error fetching hutang history:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await checkAnggota(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { nominal } = body;

        if (!nominal || nominal <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid nominal' }, { status: 400 });
        }

        const anggota = await prisma.anggota.findUnique({
            where: { user_id: user.user_id }
        });

        if (!anggota) return NextResponse.json({ success: false, error: 'Anggota not found' }, { status: 404 });

        // Create pending payment record
        const payment = await prisma.pembayaran_hutang.create({
            data: {
                anggota_id: anggota.anggota_id,
                nominal: nominal,
                status: 'pending'
            }
        });

        return NextResponse.json({ success: true, data: payment, message: 'Permintaan pembayaran berhasil dibuat' });

    } catch (error) {
        console.error('Error creating hutang payment:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
