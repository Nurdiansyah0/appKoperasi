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

        // Get today's date range for filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const history = await prisma.transaksi.findMany({
            where: {
                anggota_id: anggota.anggota_id,
                created_at: {
                    gte: today,
                    lt: tomorrow
                }
            },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        const formattedHistory = await Promise.all(history.map(async (h: any) => {
            const details = await prisma.transaksi_detail.findMany({
                where: { transaksi_id: h.transaksi_id }
            });

            const items = await Promise.all(details.map(async (d: any) => {
                const barang = await prisma.barang.findUnique({
                    where: { barang_id: d.barang_id || 0 },
                    select: { nama_barang: true }
                });
                return {
                    ...d,
                    nama_barang: barang?.nama_barang,
                    harga_satuan: Number(d.harga_satuan),
                    subtotal: Number(d.subtotal)
                };
            }));

            return {
                ...h,
                total_harga: Number(h.total_harga),
                items
            };
        }));

        return NextResponse.json({ success: true, data: formattedHistory });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
