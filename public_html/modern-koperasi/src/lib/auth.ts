import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'RahasiaSuperRahasia123';

export async function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as any;
    } catch (error) {
        return null;
    }
}

export async function checkAnggota(request: Request) {
    const user = await verifyToken(request);
    if (user && (user.role === 'anggota' || user.role === 'admin' || user.role === 'kasir')) {
        return user;
    }
    return null;
}

export async function checkKasir(request: Request) {
    const user = await verifyToken(request);
    if (user && (user.role === 'kasir' || user.role === 'admin')) {
        return user;
    }
    return null;
}

export async function checkAdmin(request: Request) {
    const user = await verifyToken(request);
    if (user && user.role === 'admin') {
        return user;
    }
    return null;
}
