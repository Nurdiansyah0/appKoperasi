import { NextResponse } from 'next/server';
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
        const data = await prisma.barang.findMany();
        const formattedData = data.map((b: any) => ({
            ...b,
            harga_modal: Number(b.harga_modal),
            harga_jual: Number(b.harga_jual),
            keuntungan: Number(b.keuntungan)
        }));
        return NextResponse.json({ success: true, data: formattedData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { nama_barang, stok, harga_modal, harga_jual } = body;

        const newBarang = await prisma.barang.create({
            data: {
                nama_barang,
                stok: parseInt(stok),
                harga_modal: parseFloat(harga_modal),
                harga_jual: parseFloat(harga_jual),
                keuntungan: parseFloat(harga_jual) - parseFloat(harga_modal)
            }
        });

        return NextResponse.json({ success: true, message: 'Barang berhasil ditambahkan', data: newBarang });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Gagal menambahkan barang' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { barang_id, nama_barang, stok, harga_modal, harga_jual } = body;

        if (!barang_id) return NextResponse.json({ success: false, error: 'ID Barang required' }, { status: 400 });

        const updatedBarang = await prisma.barang.update({
            where: { barang_id: parseInt(barang_id) },
            data: {
                nama_barang,
                stok: parseInt(stok),
                harga_modal: parseFloat(harga_modal),
                harga_jual: parseFloat(harga_jual),
                keuntungan: parseFloat(harga_jual) - parseFloat(harga_modal)
            }
        });

        return NextResponse.json({ success: true, message: 'Barang berhasil diperbarui', data: updatedBarang });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Gagal memperbarui barang' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { barang_id } = body;

        if (!barang_id) return NextResponse.json({ success: false, error: 'ID Barang required' }, { status: 400 });

        await prisma.barang.delete({
            where: { barang_id: parseInt(barang_id) }
        });

        return NextResponse.json({ success: true, message: 'Barang berhasil dihapus' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Gagal menghapus barang' }, { status: 500 });
    }
}
