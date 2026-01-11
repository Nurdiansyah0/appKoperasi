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

// GET: Fetch SHU distribution history (auto-generated from transactions)
export async function GET(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const distributions = await prisma.shu_distribusi.findMany({
            include: {
                anggota: {
                    include: {
                        user: {
                            select: { username: true }
                        }
                    }
                }
            },
            orderBy: [
                { tahun: 'desc' },
                { created_at: 'desc' }
            ]
        });

        return NextResponse.json({ success: true, data: distributions });

    } catch (error) {
        console.error('GET SHU Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
