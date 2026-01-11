import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'RahasiaSuperRahasia123';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const user = await prisma.users.findUnique({
            where: { username },
            include: {
                anggota: true
            }
        });

        if (!user || !user.password_hash) {
            return NextResponse.json(
                { success: false, error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        // Fallback for plain text password if migration is in progress or hash fails
        // (Existing data uses password_hash, but let's be safe or just follow PHP logic)
        if (!isMatch) {
            return NextResponse.json(
                { success: false, error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        const payload = {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        // Remove sensitive data before sending to client
        const { password_hash, ...safeUser } = user;

        // Flatten anggota if exists to match original structure
        let userData: any = { ...safeUser };
        if (user.anggota) {
            const { user_id, ...anggotaFields } = user.anggota;
            userData = { ...safeUser, ...anggotaFields };
        }


        return NextResponse.json({
            success: true,
            message: 'Login successful',
            token,
            user: userData
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
