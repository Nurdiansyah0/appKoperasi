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

// GET: List pending orders
export async function GET(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const pendingOrders = await prisma.transaksi.findMany({
            where: { status: 'pending' },
            include: {
                anggota: {
                    select: {
                        nama_lengkap: true
                    }
                },
                transaksi_detail: {
                    include: {
                        barang: {
                            select: {
                                nama_barang: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'asc' }
        });

        const formatted = pendingOrders.map((order: any) => ({
            ...order,
            total_harga: Number(order.total_harga),
            total_keuntungan: Number(order.total_keuntungan),
            anggota_nama: order.anggota?.nama_lengkap || 'Unknown',
            items: order.transaksi_detail.map((detail: any) => ({
                nama_barang: detail.barang?.nama_barang || 'Unknown',
                jumlah: detail.jumlah,
                harga_satuan: Number(detail.harga_satuan),
                subtotal: Number(detail.subtotal)
            }))
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Complete an order
export async function POST(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { transaksi_id } = body;

        const order = await prisma.transaksi.findUnique({
            where: { transaksi_id: Number(transaksi_id) }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        if (order.status !== 'pending') {
            return NextResponse.json({ success: false, error: 'Order already processed' }, { status: 400 });
        }

        // Mark as completed
        await prisma.transaksi.update({
            where: { transaksi_id: Number(transaksi_id) },
            data: {
                status: 'selesai',
                kasir_id: user.user_id
            }
        });

        return NextResponse.json({ success: true, message: 'Order completed successfully' });
    } catch (error: any) {
        console.error('Error completing order:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
