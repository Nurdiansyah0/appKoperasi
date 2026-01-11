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
        const orders = await prisma.transaksi.findMany({
            where: { status: { in: ['pending', 'on_process'] } },
            include: {
                anggota: {
                    select: { nama_lengkap: true }
                }
            },
            orderBy: { created_at: 'asc' }
        });

        // Fetch items for each order
        const list = await Promise.all(orders.map(async (order: any) => {
            const details = await prisma.transaksi_detail.findMany({
                where: { transaksi_id: order.transaksi_id }
            });

            // To match PHP structure, we need to fetch barang names as well
            const items = await Promise.all(details.map(async (d: any) => {
                const barang = await prisma.barang.findUnique({
                    where: { barang_id: d.barang_id || 0 },
                    select: { nama_barang: true }
                });
                return {
                    barang_id: d.barang_id,
                    nama_barang: barang?.nama_barang,
                    jumlah: d.jumlah,
                    harga_satuan: Number(d.harga_satuan)
                };
            }));

            return {
                transaksi_id: order.transaksi_id,
                anggota_id: order.anggota_id,
                nama_anggota: order.anggota?.nama_lengkap,
                metode_pembayaran: order.metode_pembayaran,
                total_harga: Number(order.total_harga),
                items: items
            };
        }));

        return NextResponse.json({ success: true, data: list });
    } catch (error: any) {
        console.error('getPesananAnggota error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
