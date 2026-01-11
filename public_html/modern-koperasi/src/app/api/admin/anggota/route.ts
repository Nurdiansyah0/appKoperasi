import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
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
    } catch (e) { return null; }
}

export async function GET(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

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
            saldo: Number(a.saldo),
            hutang: Number(a.hutang),
            shu: Number(a.shu)
        }));

        return NextResponse.json({ success: true, data: formattedData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
// Add POST for creating user/anggota if needed, following admin.php tambahUser
