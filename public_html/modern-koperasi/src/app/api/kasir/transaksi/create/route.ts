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

export async function POST(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { items, anggota_id, metode_pembayaran: metInp, total: totalInp } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Data items tidak lengkap' }, { status: 400 });
        }

        const kasir_id = user.user_id;
        const final_anggota_id = anggota_id ? parseInt(anggota_id) : null;

        // Normalize payment method
        const valid_metode = ['cash', 'qr', 'ewallet', 'transfer', 'hutang'];
        let metode_pembayaran: any = 'cash';
        if (metInp && valid_metode.includes(metInp.toLowerCase())) {
            metode_pembayaran = metInp.toLowerCase();
        } else if (metInp === 'qris') {
            metode_pembayaran = 'qr';
        }

        const result = await prisma.$transaction(async (tx: any) => {
            let total_harga = 0;
            let total_keuntungan = 0;
            const itemDetails = [];

            for (const item of items) {
                const barang_id = parseInt(item.barang_id);
                const jumlah = parseInt(item.jumlah);
                const harga_satuan = parseFloat(item.harga_satuan);

                const barang = await tx.barang.findUnique({
                    where: { barang_id }
                });

                if (!barang || (barang.stok || 0) < jumlah) {
                    throw new Error(`Stok ${barang?.nama_barang || 'Barang'} tidak mencukupi`);
                }

                const harga_modal = Number(barang.harga_modal || 0);
                const subtotal = harga_satuan * jumlah;
                const keuntungan = (harga_satuan - harga_modal) * jumlah;

                total_harga += subtotal;
                total_keuntungan += keuntungan;

                itemDetails.push({
                    barang_id,
                    jumlah,
                    harga_satuan,
                    subtotal,
                    keuntungan
                });

                // Update stock
                await tx.barang.update({
                    where: { barang_id },
                    data: { stok: { decrement: jumlah } }
                });
            }

            // Create main transaction
            const transaksi = await tx.transaksi.create({
                data: {
                    anggota_id: final_anggota_id,
                    total_harga: total_harga,
                    total_keuntungan: total_keuntungan,
                    metode_pembayaran,
                    status: 'selesai',
                    kasir_id
                }
            });

            // Create transaction details
            await tx.transaksi_detail.createMany({
                data: itemDetails.map((d: any) => ({
                    ...d,
                    transaksi_id: transaksi.transaksi_id
                }))
            });

            // Handle Anggota specific logic (Saldo/Hutang/SHU)
            if (final_anggota_id) {
                if (metode_pembayaran === 'hutang') {
                    const currentAnggota = await tx.anggota.findUnique({
                        where: { anggota_id: final_anggota_id }
                    });

                    if (!currentAnggota || Number(currentAnggota.saldo) < total_harga) {
                        throw new Error(`Saldo anggota tidak mencukupi. Saldo: Rp ${Number(currentAnggota?.saldo || 0).toLocaleString('id-ID')}`);
                    }

                    await tx.anggota.update({
                        where: { anggota_id: final_anggota_id },
                        data: {
                            saldo: { decrement: total_harga }
                            // Removed hutang increment. Account balance payment should not create debt.
                        }
                    });
                }

                // SHU Distribution
                const shu_60 = total_keuntungan * 0.6;
                const shu_30 = total_keuntungan * 0.3;
                const shu_10 = total_keuntungan * 0.1;

                await tx.anggota.update({
                    where: { anggota_id: final_anggota_id },
                    data: { shu: { increment: shu_60 } }
                });

                await tx.shu_distribusi.create({
                    data: {
                        anggota_id: final_anggota_id,
                        tahun: new Date().getFullYear(),
                        shu_60_percent: shu_60,
                        shu_30_percent: shu_30,
                        shu_10_percent: shu_10
                    }
                });
            }

            return transaksi;
        });

        return NextResponse.json({
            success: true,
            message: 'Transaksi berhasil disimpan',
            transaksi_id: result.transaksi_id,
            total: result.total_harga,
            total_keuntungan: result.total_keuntungan
        });

    } catch (error: any) {
        console.error('buatTransaksiKasir error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
