import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'RahasiaSuperRahasia123';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);

        const user = await prisma.users.findUnique({
            where: { user_id: decoded.user_id },
            include: {
                anggota: true
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const { password_hash, ...safeUser } = user;

        let userData: any = { ...safeUser };
        if (user.anggota) {
            const { user_id, ...anggotaFields } = user.anggota;
            userData = { ...safeUser, ...anggotaFields };
        }

        return NextResponse.json({
            success: true,
            user: userData
        });

    } catch (error: any) {
        console.error('Auto-login error:', error);
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
}
