import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowRightLeft, Users, Camera, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Package className="text-primary" />
        Lab Manager
      </div>
      <div className="nav-links">
        {user && (
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
        )}
        <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Package size={20} /> Products
        </NavLink>
        {user && (
          <NavLink to="/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ArrowRightLeft size={20} /> Transactions
          </NavLink>
        )}
        {user?.role !== 'admin' && (
          <NavLink to="/scanner" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Camera size={20} /> Scan QR
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Users
          </NavLink>
        )}
      </div>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        {user ? (
          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <LogOut size={16} /> Logout
          </button>
        ) : (
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <LogIn size={16} /> Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
