import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [returnDate, setReturnDate] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [hasOtherActiveTransaction, setHasOtherActiveTransaction] = useState(false);
  const [activeReservation, setActiveReservation] = useState(null);

  useEffect(() => {
    fetchProductAndData();
  }, [id, user]);

  const fetchProductAndData = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);

      // Fetch active reservation
      const resRes = await api.get(`/reservations/product/${data._id}`);
      if (resRes.data && resRes.data.length > 0) {
        setActiveReservation(resRes.data[0]);
      }

      if (user) {
         const transRes = await api.get('/transactions');
         const activeTransactions = transRes.data.filter(t => t.status === 'borrowing' || t.status === 'overdue');
         
         const activeForThisProduct = activeTransactions.find(t => 
             t.productId?._id === data._id || t.productId === data._id
         );
         
         if (activeForThisProduct) {
             setActiveTransaction(activeForThisProduct);
         } else if (user?.role === 'user' && activeTransactions.length > 0) {
             setHasOtherActiveTransaction(true);
         }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toLocalDateTime = (dateStr) => {
     if (!dateStr) return '';
     const d = new Date(dateStr);
     // offset for local timezone
     d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
     return d.toISOString().slice(0, 16);
  };

  const handleBorrow = async () => {
    if (!returnDate) return alert('Vui lòng chọn ngày và giờ trả máy!');
    if (new Date(returnDate) <= new Date()) return alert('Thời gian hẹn trả phải diễn ra trong tương lai!');

    try {
      await api.post('/transactions/borrow', { productId: product._id, returnDate });
      alert('Thuê máy thành công!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi thuê máy');
    }
  };

  const handleReturn = async () => {
     if (!activeTransaction) return;
     try {
       await api.post('/transactions/return', { transactionId: activeTransaction._id });
       alert('Trả máy thành công! Cám ơn bạn đã sử dụng.');
       navigate('/dashboard');
     } catch (error) {
       alert(error.response?.data?.message || 'Lỗi khi trả máy');
     }
  }

  const handleReserve = async () => {
     if (!reservationDate || !expectedReturnDate) return alert('Vui lòng chọn đầy đủ thời gian đặt!');
     if (new Date(expectedReturnDate) <= new Date(reservationDate)) return alert('Thời gian dự kiến trả phải sau ngày nhận!');
     
     try {
       await api.post('/reservations', {
         productId: product._id,
         reservationDate,
         expectedReturnDate
       });
       alert('Đặt lịch thành công!');
       fetchProductAndData();
     } catch (error) {
       alert(error.response?.data?.message || 'Lỗi khi đặt lịch');
     }
  };

  const handleCancelReservation = async () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy lịch đặt thiết bị này?")) {
      try {
        await api.put(`/reservations/${activeReservation._id}/cancel`);
        alert("Hủy lịch thành công!");
        setActiveReservation(null);
        fetchProductAndData();
      } catch (error) {
        alert(error.response?.data?.message || "Lỗi khi hủy lịch");
      }
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (!product) return <div>Không tìm thấy thiết bị</div>;

  const isBorrowedOrOverdue = product.status === 'borrowed' || product.status === 'overdue';
  const minReservationDate = product.activeTransactionReturnDate ? toLocalDateTime(product.activeTransactionReturnDate) : toLocalDateTime(new Date());

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Chi Tiết Thiết Bị (Device Details)</h2>
      <div className="card flex-responsive" style={{ display: 'flex', gap: '2rem' }}>
        <img src={product.image} alt={product.name} className="responsive-img" style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '12px' }} />
        
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{product.name}</h2>
            <span className={`badge badge-${product.status === 'overdue' ? 'danger' : product.status}`} style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
              {product.status.toUpperCase()}
            </span>
          </div>
          
          <div className="grid-responsive" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>Mã Thiết Bị</p>
              <p style={{ fontWeight: 600 }}>{product.productId || product._id}</p>
            </div>
            {product.cpu && (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>CPU</p>
                <p style={{ fontWeight: 600 }}>{product.cpu}</p>
              </div>
            )}
            {product.ram && (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>RAM</p>
                <p style={{ fontWeight: 600 }}>{product.ram}</p>
              </div>
            )}
            {product.ssd && (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>Bộ nhớ lưu trữ</p>
                <p style={{ fontWeight: 600 }}>{product.ssd}</p>
              </div>
            )}
          </div>
          
          {product.description && (
            <div style={{ marginTop: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
               <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Mô tả thêm:</h4>
               <p style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{product.description}</p>
            </div>
          )}

          {/* ACTIVE TRANSACTION (borrowed info visible to all) */}
          {isBorrowedOrOverdue && product.activeTransactionReturnDate && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'var(--danger-light, rgba(239, 68, 68, 0.1))', borderRadius: '8px', border: '1px solid var(--danger)' }}>
              <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                🔴 Thiết bị đang được mượn
              </p>
              <p style={{ color: 'var(--text-primary)' }}>
                Thời gian dự kiến trả: <strong>{new Date(product.activeTransactionReturnDate).toLocaleString('vi-VN')}</strong>
              </p>
              {activeTransaction && (
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn" onClick={handleReturn} style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', fontWeight: 600, backgroundColor: 'var(--success)', color: 'white' }}>
                    ☑️ Xác nhận Trả Máy Của Bạn
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            {!user ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--primary-color)', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Đăng nhập để thực hiện tác vụ</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Bạn cần đăng nhập bằng tài khoản sinh viên để có thể mượn máy hoặc đặt lịch.</p>
                <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                  Đăng Nhập Ngay
                </button>
              </div>
            ) : user?.role === 'admin' ? (
              <div style={{ padding: '1.5rem', border: '1px dashed var(--primary-light)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: 'var(--primary-color)', fontWeight: 500, fontSize: '1.1rem' }}>⚠️ Đang dùng tài khoản Quản Trị (Admin)</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '1rem 0' }}>Quyền Admin chỉ có thể Quản trị thiết bị, không thể tự thao tác thuê mượn.</p>
                <button className="btn btn-outline" onClick={() => { logout(); window.location.reload(); }} style={{ width: '100%', padding: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Đăng xuất khỏi thiết bị này
                </button>
              </div>
            ) : product.status !== 'maintenance' ? (
              <>
                {/* 1. Mượn Hiện Tại (Nếu available) */}
                {product.status === 'available' && (
                  <div style={{ marginBottom: '2rem' }}>
                    {hasOtherActiveTransaction ? (
                      <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--danger)', borderRadius: '8px' }}>
                        <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '1.1rem' }}>Vui lòng trả máy đã mượn</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Theo nguyên tắc, mỗi sinh viên chỉ được phép mượn 1 thiết bị cùng lúc. Hãy hoàn tất trả thiết bị hiện tại trước khi mượn thiết bị mới.</p>
                      </div>
                    ) : activeReservation && activeReservation.userId?._id !== user._id && new Date(activeReservation.reservationDate) <= new Date() ? (
                      <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--danger)', borderRadius: '8px' }}>
                        <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '1.1rem' }}>Thiết bị đã tới lịch của người khác</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Ai đó đã đặt trước và giờ là thời gian của họ.</p>
                      </div>
                    ) : (
                      <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Xác nhận thuê thiết bị</h3>
                        {activeReservation && activeReservation.userId?._id !== user._id && (
                          <div style={{ padding: '0.75rem', backgroundColor: 'var(--warning-light, rgba(245, 158, 11, 0.1))', color: 'var(--warning)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--warning)' }}>
                            <p style={{ fontSize: '0.875rem' }}><strong>Ghi chú:</strong> Đã có người đặt lịch thiết bị này vào lúc {new Date(activeReservation.reservationDate).toLocaleString('vi-VN')}. Bạn chỉ được mượn thời hạn tối đa đến lúc đó.</p>
                          </div>
                        )}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Ngày và Giờ dự kiến trả máy</label>
                          <input 
                            type="datetime-local" 
                            value={returnDate} 
                            onChange={e => setReturnDate(e.target.value)} 
                            max={activeReservation && activeReservation.userId?._id !== user._id ? toLocalDateTime(activeReservation.reservationDate) : null}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', fontSize: '1rem' }}
                          />
                        </div>
                        <button className="btn btn-primary" onClick={handleBorrow} style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                          Xác nhận Thuê Ngay
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Đặt Lịch (Cho cả borrowed và available) */}
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', opacity: (activeReservation && activeReservation.userId?._id !== user._id) ? 0.6 : 1 }}>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>📅 Đặt lịch mượn trước</h3>
                  {activeReservation ? (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '1rem' }}>
                      <p style={{ fontWeight: 600, color: 'var(--warning)' }}>⚠️ Thiết bị này đã được đặt lịch</p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Người đặt: {activeReservation.userId?.username}<br/>
                        Từ: {new Date(activeReservation.reservationDate).toLocaleString('vi-VN')}<br/>
                        Đến: {new Date(activeReservation.expectedReturnDate).toLocaleString('vi-VN')}
                      </p>
                      {activeReservation.userId?._id === user._id && (
                        <div style={{ marginTop: '0.75rem'}}>
                          <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '0.5rem' }}>Tài khoản của bạn đang sở hữu lịch đặt này.</p>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline" onClick={handleCancelReservation} style={{ flex: 1, padding: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.9rem' }}>
                              ❌ Hủy Mượn
                            </button>
                            {new Date() >= new Date(activeReservation.reservationDate) && product.status === 'available' && (
                              <button className="btn" onClick={async () => {
                                try {
                                  await api.post('/transactions/borrow', { productId: product._id, returnDate: activeReservation.expectedReturnDate });
                                  alert('Nhận máy thành công!');
                                  navigate('/dashboard');
                                } catch (error) {
                                  alert(error.response?.data?.message || 'Lỗi khi nhận máy');
                                }
                              }} style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--success)', color: 'white', fontSize: '0.9rem' }}>
                                ✅ Nhận Mượn Ngay
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                         <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          Nếu thiết bị đang bận hoặc bạn muốn mượn vào thời gian tới, hãy đặt lịch trước. Chỉ cho phép tối đa 1 người đặt trước.
                        </p>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Ngày giờ nhận máy (Dự kiến)</label>
                          <input 
                            type="datetime-local" 
                            min={minReservationDate}
                            value={reservationDate} 
                            onChange={e => {
                              setReservationDate(e.target.value);
                              if (new Date(expectedReturnDate) < new Date(e.target.value)) setExpectedReturnDate('');
                            }} 
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', fontSize: '1rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Ngày giờ trả máy (Dự kiến)</label>
                          <input 
                            type="datetime-local" 
                            min={reservationDate || minReservationDate}
                            value={expectedReturnDate} 
                            onChange={e => setExpectedReturnDate(e.target.value)} 
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', fontSize: '1rem' }}
                          />
                        </div>
                        <button className="btn btn-outline" onClick={() => {
                          if (product.activeTransactionReturnDate) {
                            setReservationDate(toLocalDateTime(product.activeTransactionReturnDate));
                          }
                        }} style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}>
                           Dùng ngày dự kiến hoàn trả của máy
                        </button>
                        <button className="btn" onClick={handleReserve} style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', fontWeight: 600, backgroundColor: 'var(--primary-color)', color: 'white' }}>
                          Xác nhận Đặt Lịch
                        </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Thiết bị đang được bảo trì.</p>
                <p style={{ color: 'var(--text-secondary)' }}>Không thể tiến hành thuê mượn lúc này.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
