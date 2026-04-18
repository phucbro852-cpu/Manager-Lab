import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 40%, #f1f5f9 100%)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Package size={56} color="var(--primary-color)" style={{ margin: '0 auto', filter: 'drop-shadow(0 4px 6px rgba(99, 102, 241, 0.3))' }} />
          <h2 style={{ marginTop: '1.25rem', fontSize: '1.75rem', fontWeight: '700' }} className="text-gradient">
            Login to Lab Manager
          </h2>
        </div>
        
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tài khoản</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter Account..." autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="Enter password"
                style={{ paddingRight: '2.5rem' }}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-light)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <span 
                style={{ fontSize: '0.8rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 500 }} 
                onClick={() => alert('🔒 CHÚ Ý: \nSinh viên quên mật khẩu vui lòng liên hệ Bộ phận Admin Lab:\n- Email: admin@labmanager.vn\n- SĐT: (028) 3812 3456\n\nĐể được cấp lại mật khẩu mới.')}>
                Quên mật khẩu?
              </span>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
