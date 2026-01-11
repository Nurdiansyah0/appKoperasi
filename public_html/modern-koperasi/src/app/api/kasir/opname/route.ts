import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';
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

// GET: Fetch history of stock opnames
export async function GET(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

        const opnames = await prisma.stok_opname.findMany({
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                details: true // We can't include 'users' or 'barang' via relation anymore
            }
        });

        // Manually fetch related names since we removed FK relations to fix DB Push
        const opnamesWithNames = await Promise.all(opnames.map(async (op) => {
            // Fetch User
            let username = 'Unknown';
            if (op.kasir_id) {
                const user = await prisma.users.findUnique({ where: { user_id: op.kasir_id } });
                if (user) username = user.username || 'Unknown';
            }

            // Fetch Details with Items
            const detailsWithNames = await Promise.all(op.details.map(async (d) => {
                let nama_barang = 'Unknown Item';
                if (d.barang_id) {
                    const b = await prisma.barang.findUnique({ where: { barang_id: d.barang_id } });
                    if (b) nama_barang = b.nama_barang || 'Unknown';
                }
                return { ...d, barang: { nama_barang } };
            }));

            return {
                ...op,
                users: { username },
                details: detailsWithNames
            };
        }));

        return NextResponse.json({ success: true, data: opnamesWithNames });
    } catch (error) {
        console.error("Error fetching opnames:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new stock opname
export async function POST(request: Request) {
    const user = await checkKasir(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { items } = body;
        const kasir_id = user.user_id; // Use ID from token, safer than body
        // items: [{ barang_id, stok_fisik }]

        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, error: "No items provided" }, { status: 400 });
        }

        // 1. Fetch current system stock for these items
        const barangIds = items.map((i: any) => i.barang_id);
        const barangList = await prisma.barang.findMany({
            where: { barang_id: { in: barangIds } }
        });

        const barangMap = new Map();
        barangList.forEach((b: any) => barangMap.set(b.barang_id, b.stok));

        // 2. Prepare detail records
        const detailsData = items.map((item: any) => {
            const stok_sistem = barangMap.get(item.barang_id) || 0;
            const stok_fisik = parseInt(item.stok_fisik);
            return {
                barang_id: item.barang_id,
                stok_sistem: stok_sistem,
                stok_fisik: stok_fisik,
                selisih: stok_fisik - stok_sistem
            };
        });

        // 3. Create Opname Record
        const opname = await prisma.stok_opname.create({
            data: {
                kasir_id: kasir_id,
                status: "completed",
                details: {
                    create: detailsData
                }
            }
        });

        return NextResponse.json({ success: true, message: "Stok opname saved", data: opname });
    } catch (error) {
        console.error("Error saving opname:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
