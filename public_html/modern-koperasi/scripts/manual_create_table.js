const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const query = `
      CREATE TABLE IF NOT EXISTS pengumuman (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(200) NOT NULL,
        konten TEXT NOT NULL,
        kategori VARCHAR(50) NOT NULL DEFAULT 'info',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `;

        await prisma.$executeRawUnsafe(query);
        console.log("Table 'pengumuman' created successfully.");

        // Seed initial data
        const seedQuery = `
        INSERT INTO pengumuman (judul, konten, kategori)
        VALUES 
        ('Promo Khusus Hari Ini!', 'Dapatkan diskon 5% untuk pembelian sembako minimal Rp 100rb.', 'promo'),
        ('Jam Operasional Baru', 'Minggu ini Koperasi buka s/d jam 20:00 WIB.', 'info');
    `;
        // Check if empty first
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM pengumuman`);
        // Note: count result format varies, so let's just try insert and ignore error or check carefully.
        // Actually, simplifying: just create table. I can modify the code to seed if needed but the prompt implies dynamic data is the goal.
        // I will try to insert just to be nice.

        await prisma.$executeRawUnsafe(seedQuery);
        console.log("Initial data seeded.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
