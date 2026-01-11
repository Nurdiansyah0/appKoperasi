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
        const pendingOrders = await prisma.transaksi.findMany({
            where: {
                status: { in: ['pending', 'on_process'] }
            },
            include: {
                anggota: {
                    include: {
                        user: {
                            select: { username: true }
                        }
                    }
                },
                transaksi_detail: {
                    include: {
                        barang: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Serialize BigInt values
        const serializeData = (data: any) => {
            return JSON.parse(JSON.stringify(data, (key, value) =>
                typeof value === 'bigint' ? Number(value) : value
            ));
        };

        return NextResponse.json({
            success: true,
            data: serializeData(pendingOrders)
        });

    } catch (error: any) {
        console.error('Pending Orders error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
