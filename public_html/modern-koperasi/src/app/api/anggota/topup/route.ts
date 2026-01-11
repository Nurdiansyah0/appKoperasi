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

// GET: Fetch topup request history
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

        const requests = await prisma.topup_request.findMany({
            where: { anggota_id: anggota.anggota_id },
            orderBy: { created_at: 'desc' },
            take: 20
        });

        const formatted = requests.map((r: any) => ({
            ...r,
            nominal: Number(r.nominal)
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching topup requests:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Submit new topup request
export async function POST(request: Request) {
    const user = await checkAnggota(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const anggota = await prisma.anggota.findFirst({
            where: { user_id: user.user_id }
        });

        if (!anggota) {
            return NextResponse.json({ success: false, error: 'Anggota not found' }, { status: 404 });
        }

        const body = await request.json();
        const { nominal } = body;

        if (!nominal || Number(nominal) <= 0) {
            return NextResponse.json({ success: false, error: 'Nominal harus lebih dari 0' }, { status: 400 });
        }

        const topupRequest = await prisma.topup_request.create({
            data: {
                anggota_id: anggota.anggota_id,
                nominal: Number(nominal),
                status: 'pending'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Permintaan topup berhasil diajukan',
            data: topupRequest
        });
    } catch (error) {
        console.error('Error creating topup request:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
