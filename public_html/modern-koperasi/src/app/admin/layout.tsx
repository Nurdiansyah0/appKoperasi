'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Menu } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="flex h-screen bg-slate-50 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200 z-10 transition-all">
                        <span className="text-xl font-bold text-gray-800">Admin Panel</span>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </header>

                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
                        <div className="p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
