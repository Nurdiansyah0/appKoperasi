// src/pages/kasir/tabs/KeuanganTab.jsx - Combined Setor Admin + Tarik Tunai
import { useState } from 'react';
import SetorAdminPage from '../../SetorAdmin';
import TarikTunaiPage from '../../TarikTunai';

// This tab combines both financial operations
const KeuanganTab = ({ user }) => {
    const [activeView, setActiveView] = useState('setor'); // 'setor' or 'tarik'

    return (
        <div className="space-y-4">
            {/* Sub-navigation for Keuangan tab */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveView('setor')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'setor'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Setor Admin
                </button>
                <button
                    onClick={() => setActiveView('tarik')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'tarik'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Tarik Tunai
                </button>
            </div>

            {/* Content based on active view */}
            {activeView === 'setor' ? (
                <SetorAdminPage user={user} />
            ) : (
                <TarikTunaiPage user={user} />
            )}
        </div>
    );
};

export default KeuanganTab;
