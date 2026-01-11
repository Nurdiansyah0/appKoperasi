'use server';

import prisma from '@/lib/prisma';

export async function getLandingStats() {
    try {
        // 1. Active Members (Anggota Aktif)
        const activeMembers = await prisma.anggota.count();

        // 2. Total Assets (Total Aset)
        // Assets = Total Member Savings + Total Inventory Value
        const memberSavings = await prisma.anggota.aggregate({
            _sum: {
                saldo: true,
            },
        });

        // Calculate inventory value (stock * cost price)
        // Note: Doing this in JS for flexibility, though SQL sum(stok * harga_modal) is also possible if using raw query.
        // For smaller datasets, fetch is fine. If large, raw query suggested.
        // Let's use aggregate for basic fields or raw query for computed.
        // Prisma doesn't support computing fields in aggregate directly easily without extensions or raw.
        // We will fetch all items with stock > 0 for accuracy or just use a raw count if needed.
        // For now assuming inventory isn't massive, or we can use a simpler approximation if needed.
        // Actually, let's use a raw query for performance on inventory value.
        const inventoryValueResult = await prisma.$queryRaw<{ total_inventory_value: number }[]>`
      SELECT SUM(stok * harga_modal) as total_inventory_value FROM barang
    `;

        const totalMemberSavings = Number(memberSavings._sum.saldo || 0);
        const totalInventoryValue = Number(inventoryValueResult[0]?.total_inventory_value || 0);
        const totalAssets = totalMemberSavings + totalInventoryValue;

        // 3. Disbursed Funds (Dana Tersalurkan)
        // Using Total Outstanding Loans (Hutang)
        const disbursedFundsResult = await prisma.anggota.aggregate({
            _sum: {
                hutang: true,
            },
        });
        const disbursedFunds = Number(disbursedFundsResult._sum.hutang || 0);

        return {
            activeMembers,
            totalAssets,
            disbursedFunds,
            foundingYear: 2025, // Fixed as requested
        };
    } catch (error) {
        console.error('Error fetching landing stats:', error);
        // Return fallback data in case of error to prevent page crash
        return {
            activeMembers: 0,
            totalAssets: 0,
            disbursedFunds: 0,
            foundingYear: 2025,
        };
    }
}
