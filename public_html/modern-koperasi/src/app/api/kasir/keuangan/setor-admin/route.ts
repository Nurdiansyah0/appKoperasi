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

export async function POST(request: Request) {
    const user = await checkAuth(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { nominal } = body;

        if (!nominal || Number(nominal) <= 0) {
            return NextResponse.json({ success: false, error: 'Nominal harus lebih dari 0' }, { status: 400 });
        }

        const setoran = await prisma.setoran_kasir.create({
            data: {
                kasir_id: user.user_id,
                nominal: Number(nominal),
                status: 'pending',
                created_at: new Date()
            }
        });

        return NextResponse.json({ success: true, message: 'Setoran berhasil diajukan ke admin', data: setoran });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Gagal inisiasi setoran' }, { status: 500 });
    }
}
