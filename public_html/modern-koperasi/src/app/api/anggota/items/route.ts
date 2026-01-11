import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAnggota } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const user = await checkAnggota(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        // Fetch items but ONLY public fields (hide harga_modal, keuntungan, etc)
        const items = await prisma.barang.findMany({
            select: {
                barang_id: true,
                nama_barang: true,
                stok: true,
                harga_jual: true,
                // Do NOT include harga_modal or keuntungan
            },
            orderBy: { nama_barang: 'asc' }
        });

        // Parse decimals to numbers for JSON response
        const formattedItems = items.map((item: any) => ({
            ...item,
            harga_jual: Number(item.harga_jual)
        }));

        return NextResponse.json({ success: true, data: formattedItems });
    } catch (error) {
        console.error('Error fetching items for anggota:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
