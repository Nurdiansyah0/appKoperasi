import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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

// GET: List all cashiers
export async function GET(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const kasirs = await prisma.users.findMany({
            where: { role: 'kasir' },
            select: {
                user_id: true,
                username: true,
                created_at: true,
                role: true
            },
            orderBy: { created_at: 'desc' }
        });

        // Optional: Fetch stats per cashier efficiently if needed, but for now just list
        return NextResponse.json({ success: true, data: kasirs });

    } catch (error) {
        console.error('Fetch Kasir Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create a new cashier
export async function POST(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ success: false, error: 'Username and Password are required' }, { status: 400 });
        }

        // Check availability
        const existing = await prisma.users.findUnique({
            where: { username }
        });

        if (existing) {
            return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newKasir = await prisma.users.create({
            data: {
                username,
                password_hash: hashedPassword,
                role: 'kasir'
            }
        });

        return NextResponse.json({ success: true, data: newKasir });

    } catch (error) {
        console.error('Create Kasir Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
