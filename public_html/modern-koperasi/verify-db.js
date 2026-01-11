
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const userCount = await prisma.users.count();
        console.log(`Successfully connected. Found ${userCount} users.`);

        const users = await prisma.users.findMany({ take: 5 });
        console.log('Sample users:', users.map(u => u.username));

        const anggotaCount = await prisma.anggota.count();
        console.log(`Found ${anggotaCount} anggota records.`);

    } catch (e) {
        console.error('Database connection failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
