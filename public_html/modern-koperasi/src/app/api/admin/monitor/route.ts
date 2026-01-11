import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    } catch (e) { return null; }
}

export async function GET(request: Request) {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Transactions Today & Revenue
        const transactionsToday = await prisma.transaksi.findMany({
            where: {
                created_at: {
                    gte: today,
                },
                status: "selesai",
            },
            include: {
                users: {
                    select: {
                        username: true,
                    },
                },
                anggota: {
                    select: {
                        nama_lengkap: true,
                    }
                }
            },
            orderBy: {
                created_at: "desc",
            },
        });

        const totalRevenue = transactionsToday.reduce(
            (sum, t) => sum + Number(t.total_harga),
            0
        );
        const totalTransactions = transactionsToday.length;

        // 2. Low Stock Items
        const lowStockItems = await prisma.barang.findMany({
            where: {
                stok: {
                    lte: 10,
                },
            },
            orderBy: {
                stok: "asc",
            },
            take: 10,
        });

        // 3. Active Cashiers (Distinct cashiers who made transactions today)
        const cashierStats = new Map();
        transactionsToday.forEach((t) => {
            // Priority: Kasir Username -> Member Name (App) -> Unknown
            let name = "Unknown";
            if (t.users?.username) {
                name = t.users.username;
            } else if (t.anggota?.nama_lengkap) {
                name = `App: ${t.anggota.nama_lengkap}`;
            }

            if (!cashierStats.has(name)) {
                cashierStats.set(name, { count: 0, revenue: 0, last_active: t.created_at });
            }
            const stat = cashierStats.get(name);
            stat.count += 1;
            stat.revenue += Number(t.total_harga);
            // Keep the most recent time
            if (new Date(t.created_at) > new Date(stat.last_active)) {
                stat.last_active = t.created_at;
            }
        });

        const activeCashiers = Array.from(cashierStats.entries()).map(([name, data]) => ({
            username: name,
            ...data,
        }));

        // 4. Recent Activity (Last 5 transactions)
        const recentActivity = transactionsToday.slice(0, 5).map((t) => {
            let cashierName = "Unknown";
            if (t.users?.username) {
                cashierName = t.users.username;
            } else if (t.anggota?.nama_lengkap) {
                cashierName = `App: ${t.anggota.nama_lengkap}`;
            }

            return {
                id: t.transaksi_id,
                cashier: cashierName,
                amount: Number(t.total_harga),
                time: t.created_at,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                totalRevenue,
                totalTransactions,
                activeCashiers,
                lowStockItems,
                recentActivity,
                lastUpdated: new Date()
            },
        });
    } catch (error: any) {
        console.error("Error fetching monitor stats:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
