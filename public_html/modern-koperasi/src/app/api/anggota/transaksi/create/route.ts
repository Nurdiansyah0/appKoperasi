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

export async function POST(request: Request) {
    const user = await checkAnggota(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { items, metode_pembayaran } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Keranjang belanja kosong' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            let total_harga = 0;
            let total_keuntungan = 0;
            const detailData = [];

            for (const item of items) {
                const barang = await tx.barang.findUnique({
                    where: { barang_id: item.barang_id }
                });

                if (!barang) throw new Error(`Barang ${item.nama_barang || 'Unknown'} tidak ditemukan`);
                if ((barang.stok || 0) < item.jumlah) {
                    throw new Error(`Stok ${barang.nama_barang} tidak mencukupi`);
                }

                const hargaSatuan = Number(barang.harga_jual);
                const modalSatuan = Number(barang.harga_modal);
                const subtotal = hargaSatuan * item.jumlah;
                const keuntunganItem = (hargaSatuan - modalSatuan) * item.jumlah;

                total_harga += subtotal;
                total_keuntungan += keuntunganItem;

                detailData.push({
                    barang_id: item.barang_id,
                    jumlah: item.jumlah,
                    harga_satuan: hargaSatuan,
                    subtotal: subtotal,
                    keuntungan: keuntunganItem
                });

                // Deduct stock
                await tx.barang.update({
                    where: { barang_id: item.barang_id },
                    data: { stok: { decrement: item.jumlah } }
                });
            }

            // Handle Payment Method
            let statusTransaksi = 'pending'; // All orders start as pending, Kasir marks as selesai
            let freshAnggota = await tx.anggota.findFirst({
                where: { user_id: user.user_id }
            });

            if (!freshAnggota) {
                throw new Error('Data anggota tidak ditemukan');
            }

            // Payment method specific logic
            if (metode_pembayaran === 'saldo') {
                // Check if saldo is sufficient
                if (Number(freshAnggota.saldo) < total_harga) {
                    throw new Error('Saldo tidak mencukupi');
                }

                // Deduct from saldo
                await tx.anggota.update({
                    where: { anggota_id: freshAnggota.anggota_id },
                    data: { saldo: { decrement: total_harga } }
                });

            } else if (metode_pembayaran === 'hutang') {
                // Calculate hutang limit (6-month average * 1.5)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                const pastTransactions = await tx.transaksi.findMany({
                    where: {
                        anggota_id: freshAnggota.anggota_id,
                        status: 'selesai',
                        created_at: { gte: sixMonthsAgo }
                    },
                    select: { total_harga: true }
                });

                const totalSpending = pastTransactions.reduce((sum: number, t: { total_harga: any; }) => sum + Number(t.total_harga), 0);
                const monthlyAverage = totalSpending / 6;
                const hutangLimit = monthlyAverage * 1.5;
                const currentHutang = Number(freshAnggota.hutang);
                const availableCredit = hutangLimit - currentHutang;

                // Check if within limit
                if (availableCredit < total_harga) {
                    throw new Error(`Limit hutang tidak mencukupi. Tersedia: Rp ${Math.round(availableCredit).toLocaleString('id-ID')}`);
                }

                // Increase hutang
                await tx.anggota.update({
                    where: { anggota_id: freshAnggota.anggota_id },
                    data: { hutang: { increment: total_harga } }
                });

            } else if (['cash', 'transfer', 'qris'].includes(metode_pembayaran || '')) {
                // For cash/transfer/qris: no balance changes, just record the transaction
                // Status remains 'selesai' as transaction is recorded
            } else {
                throw new Error('Metode pembayaran tidak valid');
            }

            // Create transaction record
            const transaksi = await tx.transaksi.create({
                data: {
                    anggota_id: freshAnggota.anggota_id,
                    total_harga,
                    total_keuntungan,
                    metode_pembayaran: metode_pembayaran || 'cash',
                    status: statusTransaksi
                }
            });

            // Create transaction details
            for (const detail of detailData) {
                await tx.transaksi_detail.create({
                    data: {
                        transaksi_id: transaksi.transaksi_id,
                        ...detail
                    }
                });
            }

            return { transaksi_id: transaksi.transaksi_id };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Transaction error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 400 });
    }
}
