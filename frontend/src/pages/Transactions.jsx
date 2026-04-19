import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReturn = async (id) => {
    try {
      await api.post('/transactions/return', { transactionId: id });
      alert('Returned successfully!');
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.message || 'Error returning');
    }
  };

  const handleRemind = async (t) => {
    try {
      await api.post('/notifications', {
        userId: t.userId._id,
        message: `BỘ PHẬN LAB: Nhắc nhở nghiêm khắc - Thiết bị ${t.productId?.name} của bạn đã quá hạn trả! Vui lòng hoàn trả ngay lập tức.`
      });
      alert('Đã gửi thông báo nhắc nhở thành công!');
    } catch (error) {
      alert('Lỗi khi gửi thông báo: ' + error.message);
    }
  };

  const exportCSV = () => {
    const headers = ["MSSV", "Username", "Device", "Borrow Time", "Return Time", "Status"];
    const rows = filteredTransactions.map(t => [
      t.userId?.studentId || 'N/A',
      t.userId?.username || 'N/A',
      `${t.productId?.name || 'N/A'} ${t.productId?.productId ? `(${t.productId.productId})` : ''}`,
      new Date(t.borrowDate).toLocaleString('vi-VN'),
      t.returnDate ? new Date(t.returnDate).toLocaleString('vi-VN') : 'N/A',
      t.status
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lich_su_giao_dich_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => {
    let matchSearch = true;
    if (searchTerm && user?.role === 'admin') {
      const studentId = t.userId?.studentId || '';
      const username = t.userId?.username || '';
      const devName = t.productId?.name || '';
      const devId = t.productId?.productId || '';
      matchSearch = studentId.toLowerCase().includes(searchTerm.toLowerCase()) || 
             username.toLowerCase().includes(searchTerm.toLowerCase()) ||
             devName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             devId.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    let matchStatus = true;
    if (statusFilter) {
      matchStatus = t.status === statusFilter;
    }

    return matchSearch && matchStatus;
  });

  const miniStats = {
    borrowing: transactions.filter(t => t.status === 'borrowing').length,
    overdue: transactions.filter(t => t.status === 'overdue').length,
    returned: transactions.filter(t => t.status === 'returned').length
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontWeight: '700' }}>{user?.role === 'admin' ? 'All Transactions' : 'My Transactions'}</h2>
        {user?.role === 'admin' && (
          <button className="btn btn-outline" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--success)', color: 'var(--success)' }}>
            📤 Xuất File CSV
          </button>
        )}
      </div>

      {user?.role === 'admin' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'space-around', margin: 0, backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{miniStats.borrowing}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Đang mượn</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{miniStats.overdue}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quá hạn</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{miniStats.returned}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Đã trả</div>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="card flex-responsive" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo MSSV, Tên User, Tên Thiết Bị..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flexGrow: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}
          />
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', minWidth: '150px' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="borrowing">Đang mượn (Borrowing)</option>
            <option value="overdue">Quá hạn (Overdue)</option>
            <option value="returned">Đã trả (Returned)</option>
          </select>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {user?.role === 'admin' && <th>User (MSSV)</th>}
              <th>Device</th>
              <th>Borrow Time</th>
              <th>Due Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t._id}>
                {user?.role === 'admin' && (
                  <td>
                    <div style={{ fontWeight: 500 }}>{t.userId?.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {t.userId?.studentId ? `MSSV: ${t.userId.studentId}` : 'No MSSV'}
                    </div>
                  </td>
                )}
                <td>
                  <div style={{ fontWeight: 500 }}>{t.productId?.name}</div>
                  {t.productId?.productId && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {t.productId.productId}</div>}
                </td>
                <td>{new Date(t.borrowDate).toLocaleString('vi-VN')}</td>
                <td>{t.returnDate ? new Date(t.returnDate).toLocaleString('vi-VN') : 'N/A'}</td>
                <td>
                  <span className={`badge badge-${t.status === 'returned' ? 'success' : t.status === 'overdue' ? 'danger' : 'borrowed'}`}>
                    {t.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(t.status === 'borrowing' || t.status === 'overdue') && (
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleReturn(t._id)}>
                        Return
                      </button>
                    )}
                    {user?.role === 'admin' && t.status === 'overdue' && (
                      <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', backgroundColor: 'var(--danger)', color: 'white' }} onClick={() => handleRemind(t)}>
                        🔔 Nhắc nhở
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'admin' ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Không tìm thấy giao dịch nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
