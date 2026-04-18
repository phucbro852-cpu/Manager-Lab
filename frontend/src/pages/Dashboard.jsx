import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Activity, AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{
      width: '64px', height: '64px', borderRadius: '50%',
      backgroundColor: `${color}20`, color: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</h3>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          api.get('/products'),
          api.get('/transactions')
        ]);
        setProducts(pRes.data);
        setTransactions(tRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  const isAdmin = user?.role === 'admin';

  // Stats (calculated from products)
  const stats = {
    total: products.length,
    available: products.filter(p => p.status === 'available').length,
    borrowed: products.filter(p => p.status === 'borrowed').length,
    maintenance: products.filter(p => p.status === 'maintenance').length,
    overdue: products.filter(p => p.status === 'overdue').length,
  };

  const donutData = [
    { name: 'Available', value: stats.available, color: '#10b981' },
    { name: 'Borrowed', value: stats.borrowed, color: '#f59e0b' },
    { name: 'Maintenance', value: stats.maintenance, color: '#3b82f6' },
    { name: 'Overdue', value: stats.overdue, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const userActiveBorrows = transactions.filter(t => t.status === 'borrowing').length;
  const userOverdue = transactions.filter(t => t.status === 'overdue').length;

  const recentActivities = [...transactions].sort((a,b) => new Date(b.borrowDate) - new Date(a.borrowDate)).slice(0, 5);

  const today = new Date();
  const alerts = transactions.filter(t => t.status === 'borrowing' || t.status === 'overdue').filter(t => {
      if(!t.returnDate) return false;
      const returnDate = new Date(t.returnDate);
      if(isNaN(returnDate)) return false;
      const diffTime = returnDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1 || t.status === 'overdue' || diffDays < 0;
  });

  return (
    <div>
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Dashboard {isAdmin ? '(Admin)' : '(User)'}</h2>
      
      {isAdmin ? (
        <div className="grid-cards" style={{ marginBottom: '2rem' }}>
          <StatCard title="Total Devices" value={stats.total} icon={<Package size={28} />} color="var(--primary-color)" />
          <StatCard title="Available" value={stats.available} icon={<CheckCircle size={28} />} color="var(--success)" />
          <StatCard title="Borrowed" value={stats.borrowed} icon={<Activity size={28} />} color="var(--warning)" />
          <StatCard title="Overdue" value={stats.overdue} icon={<AlertTriangle size={28} />} color="var(--danger)" />
        </div>
      ) : (
        <div className="grid-cards" style={{ marginBottom: '2rem' }}>
          <StatCard title="Total Devices" value={stats.total} icon={<Package size={28} />} color="var(--primary-color)" />
          <StatCard title="My Active Borrows" value={userActiveBorrows} icon={<Activity size={28} />} color="var(--warning)" />
          <StatCard title="My Overdue" value={userOverdue} icon={<AlertTriangle size={28} />} color="var(--danger)" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {isAdmin && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem' }}>Device Status Distribution</h3>
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>{isAdmin ? 'Recent Transactions' : 'My Recent Transactions'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentActivities.map((t, idx) => (
              <div 
                key={idx} 
                onClick={() => t.productId?._id && navigate(`/product/${t.productId._id}`)}
                className="hover-card"
                style={{ 
                  padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', 
                  borderLeft: `4px solid ${t.status === 'borrowing' ? 'var(--warning)' : (t.status === 'overdue' ? 'var(--danger)' : 'var(--success)')}`,
                  cursor: 'pointer', transition: 'all 0.2s ease', hover: { opacity: 0.8 }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{t.productId?.name || 'Unknown Device'}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(t.borrowDate).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {isAdmin && t.userId?.username ? `User: ${t.userId.username} - ` : ''} 
                  Status: <span style={{ textTransform: 'capitalize' }}>{t.status}</span>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No recent transactions.</p>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color="var(--danger)"/> Alerts & Deadlines
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.length > 0 ? alerts.slice(0, 5).map((a, idx) => {
              const overdueDays = Math.floor((new Date() - new Date(a.returnDate)) / (1000 * 60 * 60 * 24));
              const isOverdue = a.status === 'overdue' || overdueDays > 0;
              return (
                <div key={idx} style={{ padding: '0.75rem', backgroundColor: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem', color: isOverdue ? 'var(--danger)' : 'var(--warning)', display: 'flex', justifyContent: 'space-between'}}>
                     <span>{a.productId?.name}</span>
                     <span>{isOverdue ? `Overdue` : 'Due soon'}</span>
                  </div>
                  {isAdmin && a.userId?.username && <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>User: {a.userId.username}</div>}
                </div>
              );
            }) : (
              <p style={{color: 'var(--text-secondary)'}}>No pending alerts.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
