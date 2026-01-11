'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Users, ArrowRight, Wallet, Building2, Phone, Mail, MapPin, ShoppingBag } from 'lucide-react';
import LoginModal from '@/components/auth/LoginModal';

interface LandingPageContentProps {
    stats: {
        activeMembers: number;
        totalAssets: number;
        disbursedFunds: number;
        foundingYear: number;
    };
}

export default function LandingPageContent({ stats }: LandingPageContentProps) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleAuthAction = () => {
        if (user) {
            // User is already logged in, redirect based on role
            const role = user.role;
            if (role === 'admin') router.push('/admin/dashboard');
            else if (role === 'kasir') router.push('/kasir');
            else router.push('/dashboard');
        } else {
            // Not logged in, open login modal
            setIsLoginOpen(true);
        }
    };

    // Helper to format currency
    const formatCurrency = (val: number) => {
        // If value is large, abbreviate (e.g., 50M+, 1.2B) or just formatted IDR
        // For now, let's use simplified IDR formatting with M/B suffixes if large, or full format.
        // The previous design used "Rp 50M+". Let's try to mimic that dynamic adaptation if possible,
        // or just standard readable format.
        if (val >= 1_000_000_000) {
            return `Rp ${(val / 1_000_000_000).toFixed(1)}M+`;
        } else if (val >= 1_000_000) {
            return `Rp ${(val / 1_000_000).toFixed(0)}Jt+`;
        }
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Login Modal */}
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            {/* Navbar */}
            <nav className="fixed w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 relative rounded-xl overflow-hidden shadow-lg shadow-orange-500/30">
                                <Image
                                    src="/images/LogoPK.jpeg"
                                    alt="Logo Koperasi ARFF BTH"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900">Koperasi ARFF BTH</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#beranda" className="text-slate-600 hover:text-orange-600 transition-colors font-medium">Beranda</a>
                            <a href="#layanan" className="text-slate-600 hover:text-orange-600 transition-colors font-medium">Layanan</a>
                            <a href="#tentang" className="text-slate-600 hover:text-orange-600 transition-colors font-medium">Tentang Kami</a>
                        </div>
                        <button
                            onClick={handleAuthAction}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            Masuk
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="beranda" className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: "url('/images/Background.webp')" }}
                    >
                        <div className="absolute inset-0 bg-black/60" />
                    </div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >

                            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-8 leading-tight">
                                Koperasi Karyawan<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">ARFF Hang Nadim</span>
                            </h1>
                            <p className="text-xl text-slate-200 mb-10 leading-relaxed">
                                Dibangun dari iuran karyawan untuk mengelola kebutuhan konsumtif dengan sistem digital yang transparan dan mensejahterakan.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-10 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Anggota Aktif', value: formatNumber(stats.activeMembers), icon: Users },
                            { label: 'Total Aset', value: formatCurrency(stats.totalAssets), icon: Building2 },
                            { label: 'Tahun Berdiri', value: stats.foundingYear.toString(), icon: Shield },
                            { label: 'Dana Tersalurkan', value: formatCurrency(stats.disbursedFunds), icon: Wallet },
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                                <p className="text-slate-500 font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="layanan" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Layanan Unggulan Kami</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">Kami menyediakan berbagai layanan keuangan yang dirancang untuk membantu pertumbuhan ekonomi anggota.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Kebutuhan Pokok',
                                desc: 'Menyediakan berbagai kebutuhan konsumtif harian bagi anggota di area ARFF Hang Nadim Batam.',
                                icon: ShoppingBag,
                                color: 'bg-blue-500'
                            },
                            {
                                title: 'Pembagian SHU 60%',
                                desc: 'Keuntungan belanja anggota dikembalikan sebesar 60% sebagai Sisa Hasil Usaha (SHU).',
                                icon: Wallet,
                                color: 'bg-orange-500'
                            },
                            {
                                title: 'Transparansi Digital',
                                desc: 'Sistem pencatatan dan fitur transaksi digital untuk memastikan transparansi kepada seluruh anggota.',
                                icon: TrendingUp,
                                color: 'bg-green-500'
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100"
                            >
                                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg opacity-90`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-purple-600/20"></div>
                </div>
                <div className="max-w-4xl mx-auto px-4 relative z-10 text-center text-white">
                    <h2 className="text-4xl font-bold mb-6">Siap Mengelola Keuangan Anda?</h2>
                    <p className="text-slate-300 mb-10 text-lg">Daftar sekarang dan nikmati kemudahan akses keuangan digital bersama Koperasi ARFF BTH.</p>
                    <button
                        onClick={handleAuthAction}
                        className="inline-block px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-orange-50 transition-all shadow-2xl"
                    >
                        Jadi Anggota Sekarang
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer id="tentang" className="bg-white border-t border-slate-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 relative rounded-lg overflow-hidden">
                                    <Image
                                        src="/images/LogoPK.jpeg"
                                        alt="Logo Koperasi ARFF BTH"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Koperasi ARFF BTH</span>
                            </div>
                            <p className="text-slate-500 leading-relaxed max-w-sm">
                                Koperasi yang dibangun oleh karyawan ARFF Hang Nadim Batam untuk kesejahteraan bersama melalui pengelolaan kebutuhan konsumtif yang transparan.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Kontak Kami</h4>
                            <ul className="space-y-4 text-slate-600">
                                <li className="flex items-start gap-3"><MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-1" /> Jl. Hang Nadim No. 01 Batu Besar, Kecamatan Nongsa, Kota Batam, Kepulauan Riau 29466</li>
                                <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-orange-600 shrink-0" /> (0778) 7630660 Ext 2005</li>
                                <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-orange-600 shrink-0" /> koperasipkbatam@gmail.com</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Tautan</h4>
                            <ul className="space-y-4 text-slate-600">
                                <li><a href="#" className="hover:text-orange-600">Syarat & Ketentuan</a></li>
                                <li><a href="#" className="hover:text-orange-600">Kebijakan Privasi</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-8 text-center text-slate-400 text-sm">
                        &copy; 2024 Koperasi ARFF BTH. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
