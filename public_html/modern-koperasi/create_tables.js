const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Creating stok_opname table...');
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS stok_opname (
        opname_id INT NOT NULL AUTO_INCREMENT,
        kasir_id INT,
        status ENUM('pending', 'completed') DEFAULT 'completed',
        created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
        PRIMARY KEY (opname_id),
        INDEX kasir_id (kasir_id)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

        console.log('Creating stok_opname_detail table...');
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS stok_opname_detail (
        detail_id INT NOT NULL AUTO_INCREMENT,
        opname_id INT,
        barang_id INT,
        stok_sistem INT,
        stok_fisik INT,
        selisih INT,
        PRIMARY KEY (detail_id),
        INDEX opname_id (opname_id),
        INDEX barang_id (barang_id),
        CONSTRAINT stok_opname_detail_ibfk_1 FOREIGN KEY (opname_id) REFERENCES stok_opname(opname_id) ON DELETE CASCADE ON UPDATE NO ACTION
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

        console.log('Tables created successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
