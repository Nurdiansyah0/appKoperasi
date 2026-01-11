'use client';

import { useState, useEffect } from 'react';
import KasirSidebar from '@/components/kasir/KasirSidebar';
import { Menu } from 'lucide-react';

export default function KasirLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Simple auth check or just load user for display
        // Specific pages perform strict auth checks
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <KasirSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
                {/* Mobile Header (Hamburger) - Hidden on Desktop */}
                <header className="flex items-center gap-4 p-4 bg-white shadow-sm border-b border-gray-200 z-10 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-xl font-bold text-gray-800">Koperasi PK</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6">
                    {/* Only apply padding if desired, or let pages handle it */}
                    {children}
                </main>
            </div>
        </div>
    );
}
