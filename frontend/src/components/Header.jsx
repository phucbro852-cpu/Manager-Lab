import React, { useEffect, useState } from 'react';
import { Bell, User as UserIcon, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Header = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data);
      } catch (error) {
        console.error('Failed to load notifications');
      }
    };
    fetchNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div style={{ fontWeight: 600, fontSize: '1.1rem' }} className="text-gradient">
        {user ? `Welcome back${user.username ? `, ${user.username}` : ''}!` : 'Welcome to Lab Manager!'}
      </div>
      
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-outline" 
              style={{ borderRadius: '50%', padding: '0.5rem' }}
              onClick={() => { setShowDropdown(!showDropdown); setShowProfileMenu(false); }}
            >
              <Bell size={20} />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  background: 'red', color: 'white', fontSize: '10px',
                  borderRadius: '50%', padding: '2px 6px'
                }}>
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="card" style={{
                position: 'absolute', right: 0, top: '40px', width: '320px',
                zIndex: 10, padding: '1rem', maxHeight: '350px', overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>Notifications</h4>
                </div>
                {notifications.length === 0 ? <p style={{ fontSize: '0.875rem' }}>No notifications</p> : null}
                {notifications.map(n => (
                  <div 
                    key={n._id} 
                    onClick={async () => {
                      if (!n.isRead) {
                        try {
                          await api.put(`/notifications/${n._id}/read`);
                          setNotifications(notifications.map(notif => notif._id === n._id ? { ...notif, isRead: true } : notif));
                        } catch(e) {}
                      }
                    }}
                    style={{
                      padding: '0.75rem 0.5rem', borderBottom: '1px solid var(--border-color)',
                      fontSize: '0.875rem', opacity: n.isRead ? 0.6 : 1, cursor: n.isRead ? 'default' : 'pointer',
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowDropdown(false); }}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                backgroundColor: 'var(--primary-color)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden'
              }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.username?.[0]?.toUpperCase()
              )}
            </div>

            {showProfileMenu && (
              <div className="card" style={{
                position: 'absolute', right: 0, top: '45px', width: '200px',
                zIndex: 10, padding: '0.5rem 0', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600 }}>{user?.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role}</div>
                </div>
                <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="nav-link" style={{ padding: '0.5rem 1rem', margin: '0 0.5rem' }}>
                  <UserIcon size={16} /> My Profile
                </Link>
                <button onClick={handleLogout} className="nav-link" style={{ padding: '0.5rem 1rem', margin: '0 0.5rem', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--danger)' }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1.5rem' }}>
            Login
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
