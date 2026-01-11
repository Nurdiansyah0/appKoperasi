'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            console.log('ProtectedRoute Debug:', { user, allowedRoles, role: user?.role });
            if (!user) {
                console.log('Redirecting to login: No user');
                router.push('/');
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                console.log('Redirecting: Role mismatch', user.role, allowedRoles);
                // Redirect to their default route if role not allowed
                if (user.role === 'admin') router.push('/admin');
                else if (user.role === 'kasir') router.push('/kasir');
                else router.push('/dashboard');
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
        return null;
    }

    return <>{children}</>;
}
