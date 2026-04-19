import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    avatar: '',
    phone: '',
    address: '',
    className: '',
    course: '',
    major: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/users/profile');
      setFormData({
        avatar: data.avatar || '',
        phone: data.phone || '',
        address: data.address || '',
        className: data.className || '',
        course: data.course || '',
        major: data.major || '',
        password: ''
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = await api.post('/upload', formDataObj, config);
      setFormData(prev => ({ ...prev, avatar: `http://localhost:5000${data}` }));
      setMessage('Image uploaded! Click Save Changes to apply.');
    } catch (error) {
      console.error(error);
      setMessage('Error uploading image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create a payload without empty password
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      await api.put('/users/profile', payload);
      setMessage('Profile updated successfully!');
      
      // Clear message after 3s
      setTimeout(() => setMessage(''), 3000);
      
      // Update local storage user info partially for avatar display update
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      userInfo.avatar = payload.avatar;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      // Note: A full page reload or context reload is better for avatar, window.location.reload helps here
      window.location.reload();
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating profile');
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>My Profile</h2>
      
      {message && (
        <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', backgroundColor: message.includes('success') ? '#d1fae5' : '#fee2e2', color: message.includes('success') ? '#065f46' : '#b91c1c' }}>
          {message}
        </div>
      )}

      <div className="card" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
          <div style={{
            width: '150px', height: '150px', borderRadius: '50%', margin: '0 auto 1.5rem',
            backgroundColor: 'var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {formData.avatar ? (
              <img src={formData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '3rem', color: 'var(--text-secondary)' }}>{user?.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <h3 style={{ marginBottom: '0.25rem' }}>{user?.username}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Role: <span style={{ textTransform: 'capitalize' }}>{user?.role}</span></p>
        </div>

        <div style={{ flex: '2 1 400px' }}>
          <form onSubmit={handleSubmit}>
            <h4 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Personal Information</h4>
            
            <div className="form-group">
              <label>Upload Avatar</label>
              <input type="file" onChange={handleUpload} accept="image/*" />
              {formData.avatar && <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--primary-color)' }}>New avatar staged. Remember to save changes.</small>}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="09xxxxxxx" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="City, Country" />
              </div>
            </div>

            {user?.role !== 'admin' && (
              <>
                <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Education Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Class</label>
                    <input type="text" name="className" value={formData.className} onChange={handleChange} placeholder="CS101" disabled style={{ backgroundColor: '#e2e8f0', cursor: 'not-allowed' }}/>
                  </div>
                  <div className="form-group">
                    <label>Course Data</label>
                    <input type="text" name="course" value={formData.course} onChange={handleChange} placeholder="K64" disabled style={{ backgroundColor: '#e2e8f0', cursor: 'not-allowed' }}/>
                  </div>
                  <div className="form-group">
                    <label>Chuyên ngành</label>
                    <input type="text" name="major" value={formData.major} onChange={handleChange} placeholder="IT" disabled style={{ backgroundColor: '#e2e8f0', cursor: 'not-allowed' }}/>
                  </div>
                </div>
              </>
            )}

            <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Security</h4>
            <div className="form-group">
              <label>New Password (Leave blank to keep current password)</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter new password to change" />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
