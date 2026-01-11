// src/pages/kasir/tabs/RiwayatTab.jsx - Import existing HistoryTransaksi page
import HistoryTransaksi from '../../HistoryTransaksi';

// This tab wraps the existing HistoryTransaksi page
const RiwayatTab = ({ user }) => {
    return <HistoryTransaksi user={user} />;
};

export default RiwayatTab;
