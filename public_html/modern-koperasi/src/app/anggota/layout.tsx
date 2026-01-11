'use client';

import { useState } from 'react';
import AnggotaSidebar from '@/components/anggota/AnggotaSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Menu } from 'lucide-react';

export default function AnggotaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute allowedRoles={['anggota']}>
            <div className="flex h-screen bg-slate-50 overflow-hidden">
                {/* Sidebar */}
                <AnggotaSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

                {/* Main Content Wrapper */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile Header (Hamburger) */}
                    <header className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200 z-10 transition-all">
                        <span className="text-xl font-bold text-gray-800">Koperasi PK</span>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
