// src/pages/kasir/tabs/PembayaranHutangTab.jsx - Import existing KasirPembayaranHutang page
import KasirPembayaranHutang from '../../KasirPembayaranHutang';

// This tab wraps the existing KasirPembayaranHutang page
const PembayaranHutangTab = ({ user }) => {
    return <KasirPembayaranHutang user={user} />;
};

export default PembayaranHutangTab;
