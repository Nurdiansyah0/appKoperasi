import React from 'react';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export default function AdminLayout({ user, setUser }) {
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '#/login';
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className="fixed inset-y-0 left-0 z-50 hidden lg:block">
                <Sidebar user={user} onLogout={handleLogout} />
            </aside>

            <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    {/* Mobile Header Placeholder could go here */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
