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
        if (decoded.role !== 'kasir' && decoded.role !== 'admin' && decoded.role !== 'anggota') return null;
        return decoded;
    } catch (e) { return null; }
}

export async function GET(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const items = await prisma.barang.findMany({
            where: { stok: { gt: 0 } },
            orderBy: { nama_barang: 'asc' }
        });

        const formattedItems = items.map((b: any) => ({
            ...b,
            harga_jual: Number(b.harga_jual),
            harga_modal: Number(b.harga_modal),
            keuntungan: Number(b.keuntungan)
        }));

        return NextResponse.json({ success: true, data: formattedItems });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
