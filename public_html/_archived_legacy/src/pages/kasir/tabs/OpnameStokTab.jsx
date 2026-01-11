// src/pages/kasir/tabs/OpnameStokTab.jsx - Combined Opname Stok + Review Opname
import { useState } from 'react';
import OpnameStok from '../../OpnameStok';
import ReviewOpname from '../../ReviewOpname';

// This tab combines both opname stok and review opname pages
const OpnameStokTab = ({ user }) => {
    const [activeView, setActiveView] = useState('opname'); // 'opname' or 'review'

    return (
        <div className="space-y-4">
            {/* Sub-navigation for Stok tab */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveView('opname')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'opname'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Opname Stok
                </button>
                <button
                    onClick={() => setActiveView('review')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'review'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Review Opname
                </button>
            </div>

            {/* Content based on active view */}
            {activeView === 'opname' ? (
                <OpnameStok user={user} />
            ) : (
                <ReviewOpname user={user} />
            )}
        </div>
    );
};

export default OpnameStokTab;
