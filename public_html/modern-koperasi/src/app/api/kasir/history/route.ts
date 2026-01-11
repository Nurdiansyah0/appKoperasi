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

export async function GET(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const history = await prisma.transaksi.findMany({
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                anggota: {
                    select: { nama_lengkap: true }
                }
            }
        });

        const formattedHistory = await Promise.all(history.map(async (h: any) => {
            const details = await prisma.transaksi_detail.findMany({
                where: { transaksi_id: h.transaksi_id }
            });

            // Since I can't be 100% sure about joins on ignored models, 
            // I'll fetch barang names manually for safety or if I didn't re-generate properly.
            // But I DID re-generate.

            const items = await Promise.all(details.map(async (d: any) => {
                const barang = await prisma.barang.findUnique({
                    where: { barang_id: d.barang_id || 0 },
                    select: { nama_barang: true }
                });
                return {
                    ...d,
                    nama_barang: barang?.nama_barang,
                    harga_satuan: Number(d.harga_satuan),
                    subtotal: Number(d.subtotal),
                    keuntungan: Number(d.keuntungan)
                };
            }));

            return {
                ...h,
                total_harga: Number(h.total_harga),
                total_keuntungan: Number(h.total_keuntungan),
                nama_anggota: h.anggota?.nama_lengkap,
                items
            };
        }));

        return NextResponse.json({ success: true, data: formattedHistory });
    } catch (error: any) {
        console.error('getHistoryTransaksi error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
