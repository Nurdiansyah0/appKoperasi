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

// GET: List pending setoran
export async function GET(request: Request) {
    const user = await checkAdmin(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const setoran = await prisma.setoran_kasir.findMany({
            where: { status: 'pending' },
            include: {
                users: {
                    select: { username: true, role: true }
                }
            },
            orderBy: { created_at: 'asc' }
        });

        const formatted = setoran.map((s: any) => ({
            ...s,
            nominal: Number(s.nominal)
        }));

        return NextResponse.json({ success: true, data: formatted });

    } catch (error) {
        console.error('Error fetching setoran:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Approve or Reject
export async function POST(request: Request) {
    const user = await checkAdmin(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { setoran_id, action } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        const setoran = await prisma.setoran_kasir.findUnique({
            where: { setoran_id: setoran_id }
        });

        if (!setoran || setoran.status !== 'pending') {
            return NextResponse.json({ success: false, error: 'Request not found or already processed' }, { status: 404 });
        }

        await prisma.setoran_kasir.update({
            where: { setoran_id: setoran_id },
            data: {
                status: action === 'approve' ? 'approved' : 'rejected'
            }
        });

        return NextResponse.json({ success: true, message: `Setoran ${action}ed` });

    } catch (error) {
        console.error('Error processing setoran:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
