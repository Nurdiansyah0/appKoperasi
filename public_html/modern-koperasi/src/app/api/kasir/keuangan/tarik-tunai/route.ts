import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'RahasiaSuperRahasia123';

async function checkAuth(request: Request) {
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

export async function POST(request: Request) {
    const user = await checkAuth(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { anggota_id, nominal } = body;

        if (!anggota_id || !nominal || Number(nominal) < 20000) {
            return NextResponse.json({ success: false, error: 'Invalid input. Minimal penarikan Rp 20.000' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const anggota = await tx.anggota.findUnique({ where: { anggota_id: Number(anggota_id) } });
            if (!anggota) throw new Error('Anggota not found');

            if (Number(anggota.saldo) < Number(nominal)) {
                throw new Error('Saldo tidak mencukupi');
            }

            // Create Tarik Tunai Record
            const tarik = await tx.tarik_tunai.create({
                data: {
                    kasir_id: user.user_id,
                    anggota_id: Number(anggota_id),
                    nominal: Number(nominal),
                    created_at: new Date()
                }
            });

            // Update Saldo
            await tx.anggota.update({
                where: { anggota_id: Number(anggota_id) },
                data: { saldo: { decrement: Number(nominal) } }
            });

            return tarik;
        });

        return NextResponse.json({ success: true, message: 'Tarik tunai berhasil', data: result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
