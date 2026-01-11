'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/AuthContext';

interface Kasir {
    user_id: number;
    username: string;
    created_at: string;
}

export default function AdminKasirPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [kasirs, setKasirs] = useState<Kasir[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedKasir, setSelectedKasir] = useState<Kasir | null>(null);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const fetchKasirs = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/admin/kasir', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setKasirs(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch kasirs:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchKasirs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            let url = '/api/admin/kasir';
            let method = 'POST';
            let body: any = { username, password };

            if (editMode && selectedKasir) {
                url = `/api/admin/kasir/${selectedKasir.user_id}`;
                method = 'PUT';
                // Only send password if editing
                if (!password) {
                    delete body.password; // Don't update if empty
                } else {
                    delete body.username; // Cannot update username typically, checking implementation
                    body = { password };
                }
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: editMode ? 'Cashier updated successfully' : 'Cashier created successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
                closeModal();
                fetchKasirs();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Something went wrong'
            });
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`/api/admin/kasir/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (data.success) {
                    Swal.fire('Deleted!', 'Cashier has been deleted.', 'success');
                    fetchKasirs();
                } else {
                    Swal.fire('Error!', data.error, 'error');
                }
            } catch (error) {
                Swal.fire('Error!', 'Failed to delete cashier.', 'error');
            }
        }
    };

    const openAddModal = () => {
        setEditMode(false);
        setSelectedKasir(null);
        setUsername('');
        setPassword('');
        setIsModalOpen(true);
    };

    const openEditModal = (kasir: Kasir) => {
        setEditMode(true);
        setSelectedKasir(kasir);
        setUsername(kasir.username);
        setPassword(''); // Empty for security, only fill if changing
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white shadow mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Manage Cashiers</h1>
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Verified Cashiers</h2>
                        <button
                            onClick={openAddModal}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Cashier
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {kasirs.length > 0 ? (
                                    kasirs.map((kasir) => (
                                        <tr key={kasir.user_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{kasir.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(kasir.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(kasir)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Edit Pass
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(kasir.user_id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                            No cashiers found. Click "Add Cashier" to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editMode ? 'Edit Cashier Password' : 'Add New Cashier'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!editMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        placeholder="Enter cashier username"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editMode ? 'New Password' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    required={!editMode}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder={editMode ? 'Leave blank to keep current' : 'Enter password'}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editMode ? 'Update Password' : 'Create Cashier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
