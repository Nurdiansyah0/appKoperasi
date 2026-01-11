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
        const data = await prisma.anggota.findMany({
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });

        const formattedData = data.map((a: any) => ({
            anggota_id: a.anggota_id,
            username: a.user?.username,
            nama_lengkap: a.nama_lengkap, // Assuming this field exists, useful for display
            saldo: Number(a.saldo),
            hutang: Number(a.hutang)
        }));

        return NextResponse.json({ success: true, data: formattedData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
