import React, { useEffect, useState } from 'react';
import api from '../api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [phone, setPhone] = useState('');
  const [className, setClassName] = useState('');
  const [course, setCourse] = useState('');
  const [major, setMajor] = useState('');
  const [avatar, setAvatar] = useState('');
  const [studentId, setStudentId] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (u) => {
    setEditingId(u._id);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setPhone(u.phone || '');
    setClassName(u.className || '');
    setCourse(u.course || '');
    setMajor(u.major || '');
    setAvatar(u.avatar || '');
    setStudentId(u.studentId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setRole('user');
    setPhone('');
    setClassName('');
    setCourse('');
    setMajor('');
    setAvatar('');
    setStudentId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { username, role, phone, className, course, major, avatar, studentId };
      if (password) payload.password = password;
      
      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        alert('User updated successfully');
      } else {
        if (!password) return alert('Password required');
        await api.post('/users', { ...payload, password });
        alert('User added successfully');
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = await api.post('/upload', formDataObj, config);
      setAvatar(`http://localhost:5000${data}`);
      alert('Avatar uploaded! Ready to submit.');
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
  };

  return (
    <div>
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontWeight: '700' }}>User Management</h2>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap-reverse' }}>
        <div className="card" style={{ flex: '1 1 350px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {editingId ? `✏️ Edit User: ${username}` : '✨ Add New User'}
          </h3>
          <form onSubmit={handleSubmit}>
            
            {role === 'user' && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--border-color)', 
                  margin: '0 auto 0.75rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '3px solid var(--primary-light)'
                }}>
                  {avatar ? (
                    <img src={avatar} alt="preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <span style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>No Image</span>
                  )}
                </div>
                <label className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer', borderRadius: '20px' }}>
                  Choose Avatar
                  <input type="file" onChange={handleUpload} accept="image/*" style={{ display: 'none' }} />
                </label>
              </div>
            )}

            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Username</label>
                <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Password {editingId && <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>(Leave blank to keep)</span>}</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required={!editingId} />
              </div>
            </div>

            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Role</label>
                <select value={role} onChange={e=>setRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {role === 'user' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Student ID (Mã SV)</label>
                    <input type="text" value={studentId} onChange={e=>setStudentId(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Phone Number</label>
                    <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {role === 'user' && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', marginTop: '1.25rem', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Education Details</h4>
                <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Class</label>
                    <input type="text" value={className} onChange={e=>setClassName(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Course</label>
                    <input type="text" value={course} onChange={e=>setCourse(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Chuyên ngành</label>
                    <input type="text" value={major} onChange={e=>setMajor(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" type="submit" style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}>
                {editingId ? 'Update User' : 'Add User to System'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={resetForm} style={{ padding: '0.75rem', fontSize: '1rem' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="table-container" style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search Users by Name or Student ID..." 
            value={searchUser} 
            onChange={e => setSearchUser(e.target.value)}
            style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%' }}
          />
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users.filter(u => {
                const term = searchUser.toLowerCase();
                const matchName = u.username.toLowerCase().includes(term);
                const matchId = u.studentId ? u.studentId.toLowerCase().includes(term) : false;
                return matchName || matchId;
              })).map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.username}</div>
                    {u.studentId && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {u.studentId}</div>}
                  </td>
                  <td><span className={`badge badge-${u.role === 'admin' ? 'borrowed' : 'available'}`}>{u.role}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {u.username !== 'admin' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleEdit(u)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(u._id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
