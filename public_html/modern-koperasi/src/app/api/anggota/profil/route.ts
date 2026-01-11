import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
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

export async function GET(request: Request) {
    const user = await checkAnggota(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const userWithAnggota = await prisma.users.findUnique({
            where: { user_id: user.user_id },
            include: { anggota: true }
        });

        if (!userWithAnggota || !userWithAnggota.anggota) {
            return NextResponse.json({ success: false, error: 'Data anggota tidak ditemukan' }, { status: 404 });
        }

        const { password_hash, ...safeUser } = userWithAnggota;
        const anggotaData = userWithAnggota.anggota;

        const { user_id: _, ...anggotaFields } = anggotaData;
        const data = {
            ...safeUser,
            ...anggotaFields,
            saldo: Number(anggotaData.saldo),
            hutang: Number(anggotaData.hutang),
            shu: Number(anggotaData.shu)
        };

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
    const user = await checkAnggota(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { email, password } = body;

        const updateUser: any = {};
        const updateAnggota: any = {};

        // 1. Update Email if provided
        if (email) {
            // Check if email is available in ANGGOTA table (since users might not have email)
            const existingAnggota = await prisma.anggota.findFirst({
                where: {
                    email: email,
                    NOT: { user_id: user.user_id }
                }
            });

            if (existingAnggota) {
                return NextResponse.json({ success: false, error: 'Email sudah digunakan oleh anggota lain' }, { status: 400 });
            }

            updateAnggota.email = email;
            // Also update users email if the column exists, but based on lint error it might not.
            // We will safely ignore updating users.email for now and rely on anggota.email
        }

        // 2. Update Password if provided
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateUser.password_hash = await bcrypt.hash(password, salt);
        }

        // Perform Updates
        if (Object.keys(updateAnggota).length > 0) {
            await prisma.anggota.update({
                where: { user_id: user.user_id },
                data: updateAnggota
            });
        }

        if (Object.keys(updateUser).length > 0) {
            await prisma.users.update({
                where: { user_id: user.user_id },
                data: updateUser
            });
        }

        if (Object.keys(updateAnggota).length === 0 && Object.keys(updateUser).length === 0) {
            return NextResponse.json({ success: true, message: 'Tidak ada perubahan' });
        }

        return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui' });

    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ success: false, error: 'Gagal memperbarui profil' }, { status: 500 });
    }
}
