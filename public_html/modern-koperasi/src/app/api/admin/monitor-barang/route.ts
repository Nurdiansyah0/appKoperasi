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

    const { searchParams } = new URL(request.url);
    const tanggal_awal = searchParams.get('tanggal_awal');
    const tanggal_akhir = searchParams.get('tanggal_akhir');
    const barang_id = searchParams.get('barang_id');
    const group_by = searchParams.get('group_by') || 'daily';

    try {
        let whereClause: any = { status: 'selesai' };
        if (tanggal_awal && tanggal_akhir) {
            whereClause.created_at = {
                gte: new Date(tanggal_awal),
                lte: new Date(tanggal_akhir + 'T23:59:59')
            };
        }

        // Prisma doesn't support complex GROUP BY with joins very easily in one go
        // for historical reasons in this exact PHP structure, we might want to use $queryRaw
        // or perform separate queries and aggregate.

        // For simplicity and to match the PHP exactly, I'll use a raw query here
        // but sanitized via Prisma.

        // Actually, I'll try to find a more "Prisma" way if possible, 
        // but the PHP query is quite specific with GROUP_CONCAT.

        const result = await prisma.$queryRawUnsafe(`
      SELECT 
          b.barang_id,
          b.nama_barang,
          ${group_by === 'monthly' ? "DATE_FORMAT(t.created_at, '%Y-%m') as bulan, DATE_FORMAT(t.created_at, '%M %Y') as bulan_label" : "DATE(t.created_at) as tanggal, DATE_FORMAT(t.created_at, '%M %Y') as bulan_label"},
          SUM(td.jumlah) as total_terjual,
          SUM(td.subtotal) as total_pendapatan,
          SUM(td.keuntungan) as total_keuntungan,
          COUNT(DISTINCT t.transaksi_id) as total_transaksi,
          GROUP_CONCAT(DISTINCT a.nama_lengkap SEPARATOR ', ') as pembeli
      FROM transaksi_detail td
      JOIN transaksi t ON td.transaksi_id = t.transaksi_id
      JOIN barang b ON td.barang_id = b.barang_id
      JOIN anggota a ON t.anggota_id = a.anggota_id
      WHERE t.status = 'selesai'
      ${tanggal_awal && tanggal_akhir ? "AND DATE(t.created_at) BETWEEN ? AND ?" : ""}
      ${barang_id && barang_id !== 'all' ? "AND td.barang_id = ?" : ""}
      GROUP BY b.barang_id, b.nama_barang, ${group_by === 'monthly' ? "bulan, bulan_label" : "tanggal, bulan_label"}
      ORDER BY ${group_by === 'monthly' ? "bulan" : "tanggal"} DESC, total_terjual DESC
    `, ...(tanggal_awal && tanggal_akhir ? [tanggal_awal, tanggal_akhir] : []), ...(barang_id && barang_id !== 'all' ? [barang_id] : []));

        return NextResponse.json({
            success: true,
            data: result,
            group_by
        });

    } catch (error: any) {
        console.error('Monitor Barang error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
