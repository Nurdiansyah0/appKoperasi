'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                router.push('/login');
                return;
            }

            try {
                const user = JSON.parse(userData);

                if (user.role === 'admin') {
                    router.push('/admin/dashboard');
                } else if (user.role === 'kasir') {
                    router.push('/kasir/dashboard');
                } else if (user.role === 'anggota') {
                    router.push('/anggota/dashboard');
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );
}
