'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { Eye, EyeOff, Lock, User, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response: any = await api.post('/auth/login', { username, password });

            if (response.success) {

                login(response.user, response.token);

                Swal.fire({
                    icon: 'success',
                    title: 'Login Berhasil',
                    text: `Selamat datang, ${response.user.nama_user || response.user.username}`,
                    timer: 1500,
                    showConfirmButton: false
                });

                // Redirect based on role
                const role = response.user.role;
                if (role === 'admin') router.push('/admin/dashboard');
                else if (role === 'kasir') router.push('/kasir');
                else router.push('/dashboard');

                onClose(); // Close modal on success
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: error.sanitizedMessage || 'Username atau password salah'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 rounded-full p-1"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-8 pt-10">
                                <div className="flex justify-center mb-6">
                                    <div className="w-16 h-16 relative rounded-xl overflow-hidden shadow-lg shadow-orange-500/30">
                                        <Image
                                            src="/images/LogoPK.jpeg"
                                            alt="Logo Koperasi ARFF BTH"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">Selamat Datang</h2>
                                <p className="text-slate-500 text-center mb-6 text-sm">Masuk ke akun Koperasi PK Batam</p>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                                <User size={18} />
                                            </span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-150"
                                                placeholder="Masukkan username Anda"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                                <Lock size={18} />
                                            </span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-150"
                                                placeholder="Masukkan password Anda"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? 'Sedang Masuk...' : 'Masuk Sekarang'}
                                    </button>
                                </form>
                            </div>

                            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
                                <p className="text-xs text-slate-400">© 2026 Koperasi PK Batam</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
