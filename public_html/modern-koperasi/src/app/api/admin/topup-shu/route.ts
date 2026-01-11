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
    } catch (e) {
        return null;
    }
}

export async function POST(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { username, nominal } = body;

        if (!username || nominal <= 0) {
            return NextResponse.json({ success: false, error: 'Data tidak valid' }, { status: 400 });
        }

        // Cari anggota berdasarkan username
        const anggota = await prisma.anggota.findFirst({
            where: {
                user: {
                    username: username
                }
            },
            include: {
                user: true
            }
        });

        if (!anggota) {
            return NextResponse.json({ success: false, error: 'Anggota tidak ditemukan' }, { status: 404 });
        }

        const currentSHU = Number(anggota.shu);
        const currentSaldo = Number(anggota.saldo);

        if (currentSHU < nominal) {
            return NextResponse.json({ success: false, error: 'SHU tidak mencukupi' }, { status: 400 });
        }

        // Update saldo dan SHU
        await prisma.anggota.update({
            where: {
                anggota_id: anggota.anggota_id
            },
            data: {
                shu: currentSHU - nominal,
                saldo: currentSaldo + nominal
            }
        });

        return NextResponse.json({ success: true, message: 'Topup berhasil dilakukan' });

    } catch (error: any) {
        console.error('Topup SHU error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
