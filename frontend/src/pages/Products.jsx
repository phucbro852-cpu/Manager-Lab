import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const { user } = useAuth();
  
  const [showQRModal, setShowQRModal] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  
  // Form States
  const [editingId, setEditingId] = useState(null);
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [cpu, setCpu] = useState('');
  const [ram, setRam] = useState('');
  const [ssd, setSsd] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('available');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setProductId('');
    setName('');
    setCpu('');
    setRam('');
    setSsd('');
    setImage('');
    setStatus('available');
    setShowFormModal(true);
  };

  const openEditForm = (p) => {
    setEditingId(p._id);
    setProductId(p.productId || '');
    setName(p.name);
    setCpu(p.cpu || '');
    setRam(p.ram || '');
    setSsd(p.ssd || '');
    setImage(p.image || '');
    setStatus(p.status || 'available');
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this laptop?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        alert(error.response?.data?.message || 'Error executing delete');
      }
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    try {
      const { data } = await api.post('/upload', formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImage(`http://localhost:5000${data}`);
    } catch (error) {
      alert('Error uploading image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { productId, name, cpu, ram, ssd, image, status };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        alert('Laptop updated successfully');
      } else {
        await api.post('/products', payload);
        alert('Laptop added successfully');
      }
      setShowFormModal(false);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing request');
    }
  };

  const filteredProducts = products.filter(p => {
    const term = search.toLowerCase();
    const matchName = p.name.toLowerCase().includes(term);
    const matchId = p.productId ? p.productId.toLowerCase().includes(term) : false;
    return (matchName || matchId) && (filter ? p.status === filter : true);
  }).sort((a, b) => {
    if (a.status === 'available' && b.status !== 'available') return -1;
    if (a.status !== 'available' && b.status === 'available') return 1;
    return 0;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Laptop Management</h2>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={openAddForm}>
            + Add Laptop
          </button>
        )}
      </div>

      <div className="card flex-responsive" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search laptops by Name or ID..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ flexGrow: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}
        />
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="borrowed">Borrowed</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Name</th>
              <th>Specs (CPU/RAM/SSD)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p._id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>{p.productId || p._id.slice(-6)}</td>
                <td>
                  <Link to={`/product/${p._id}`} style={{ fontWeight: 600, color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {p.image && <img src={p.image} alt="loc" style={{width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover'}} />}
                    {p.name}
                  </Link>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {p.cpu && p.ram && p.ssd ? `${p.cpu} / ${p.ram} / ${p.ssd}` : 'N/A'}
                </td>
                <td>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setShowQRModal(p)}>QR</button>
                    {user?.role === 'admin' && (
                      <>
                        <button className="btn" style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openEditForm(p)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(p._id)}>Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showQRModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '400px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>QR Code - {showQRModal.name}</h3>
            <div style={{ padding: '2rem', background: '#fff', display: 'inline-block', borderRadius: '12px' }}>
              <QRCodeSVG value={showQRModal.qrCode} size={200} />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Scan this code to manage the laptop.
            </p>
            <button className="btn btn-primary" onClick={() => setShowQRModal(null)} style={{ marginTop: '1rem', width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {showFormModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {editingId ? `✏️ Edit Laptop: ${name}` : '💻 Add New Laptop'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '120px', height: '120px', backgroundColor: 'var(--bg-color)', border: '2px dashed var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', overflow: 'hidden'
                  }}>
                    {image ? <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="laptop preview" /> : <span style={{fontSize: '0.75rem', color: 'gray'}}>No Image</span>}
                  </div>
                  <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                    Upload Photo
                    <input type="file" onChange={handleUpload} style={{ display: 'none' }} accept="image/*" />
                  </label>
                </div>

                <div style={{ flex: '2 1 300px' }}>
                  <div className="form-group">
                    <label>Product ID (Mã Máy)</label>
                    <input type="text" value={productId} onChange={e=>setProductId(e.target.value)} required placeholder="e.g. LAP-001" />
                  </div>
                  <div className="form-group">
                    <label>Laptop Name</label>
                    <input type="text" value={name} onChange={e=>setName(e.target.value)} required placeholder="e.g. ThinkPad T14 Gen 2" />
                  </div>
                  {editingId && (
                    <div className="form-group">
                      <label>Status</label>
                      <select value={status} onChange={e=>setStatus(e.target.value)}>
                        <option value="available">Available</option>
                        <option value="borrowed">Borrowed</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Technical Specifications</h4>
                <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>CPU</label>
                    <input type="text" value={cpu} onChange={e=>setCpu(e.target.value)} placeholder="Core i5-1135G7" style={{ padding: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>RAM</label>
                    <input type="text" value={ram} onChange={e=>setRam(e.target.value)} placeholder="16GB DDR4" style={{ padding: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>SSD</label>
                    <input type="text" value={ssd} onChange={e=>setSsd(e.target.value)} placeholder="512GB NVMe" style={{ padding: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowFormModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Save Changes' : 'Create Laptop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
