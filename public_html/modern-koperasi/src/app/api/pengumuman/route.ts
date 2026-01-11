import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pengumuman = await prisma.pengumuman.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
            take: 5
        });

        return NextResponse.json({ success: true, data: pengumuman });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch announcements' }, { status: 500 });
    }
}
