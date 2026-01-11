import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
        const { transaksi } = body; // Expecting array of { transaksi_id }

        if (!transaksi || !Array.isArray(transaksi)) {
            return NextResponse.json(
                { success: false, error: "Invalid data format" },
                { status: 400 }
            );
        }

        const ids = transaksi.map((t: any) => t.transaksi_id);

        // Update status to 'selesai'
        await prisma.transaksi.updateMany({
            where: {
                transaksi_id: {
                    in: ids,
                },
            },
            data: {
                status: "selesai",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Transactions updated successfully",
        });
    } catch (error) {
        console.error("Error completing transaction:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
