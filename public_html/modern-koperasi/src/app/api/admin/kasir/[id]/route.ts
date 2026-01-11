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

// PUT: Update Cashier (e.g., reset password)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await checkAdmin(request);
    if (!admin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        const { password } = await request.json();

        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (password) {
            dataToUpdate.password_hash = await bcrypt.hash(password, 10);
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ success: false, error: 'No data to update' }, { status: 400 });
        }

        const updated = await prisma.users.update({
            where: { user_id: id, role: 'kasir' }, // Ensure we only edit kasir
            data: dataToUpdate
        });

        return NextResponse.json({ success: true, data: updated });

    } catch (error) {
        console.error('Update Kasir Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove Cashier
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await checkAdmin(request);
    if (!admin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        // Check for dependencies (transactions)
        const hasTransactions = await prisma.transaksi.findFirst({
            where: { kasir_id: id }
        });

        if (hasTransactions) {
            return NextResponse.json({ success: false, error: 'Cannot delete cashier with existing transactions. Consider disabling instead (feature pending).' }, { status: 400 });
        }

        await prisma.users.delete({
            where: { user_id: id, role: 'kasir' }
        });

        return NextResponse.json({ success: true, message: 'Cashier deleted' });

    } catch (error) {
        console.error('Delete Kasir Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
