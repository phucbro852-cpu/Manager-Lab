const express = require('express');
const Reservation = require('../models/Reservation');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Quyền quản trị không được phép đặt thiết bị' });
    }
    const { productId, reservationDate, expectedReturnDate } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.status === 'maintenance') return res.status(400).json({ message: 'Cannot reserve a product in maintenance' });

    // Ensure strictly 1 active reservation
    const existingReservations = await Reservation.find({ productId, status: 'active' });
    if (existingReservations.length >= 1) {
      return res.status(400).json({ message: 'Thiết bị này đã có người đặt trước. Chỉ cho phép tối đa 1 lịch đặt.' });
    }

    // Ensure reservation date is sensible natively
    if (new Date(reservationDate) < new Date()) {
      return res.status(400).json({ message: 'Thời gian đặt phải trong tương lai' });
    }

    // If borrowed, reservation date MUST be >= current transaction's return date
    if (product.status === 'borrowed' || product.status === 'overdue') {
      const activeTransaction = await Transaction.findOne({ productId, status: { $in: ['borrowing', 'overdue'] }});
      if (activeTransaction && activeTransaction.returnDate) {
        if (new Date(reservationDate) < new Date(activeTransaction.returnDate)) {
          return res.status(400).json({ message: 'Không được đặt trước thời điểm dự kiến trả máy của người hiện tại.' });
        }
      }
    }

    const reservation = new Reservation({
      userId: req.user.id,
      productId,
      reservationDate,
      expectedReturnDate
    });

    const createdReservation = await reservation.save();
    res.status(201).json(createdReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const reservations = await Reservation.find({ productId: req.params.productId, status: 'active' })
      .populate('userId', 'username studentId')
      .sort({ reservationDate: 1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.id, status: 'active' })
      .populate('productId', 'name image status')
      .sort({ reservationDate: 1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Không tìm thấy lịch đặt' });
    
    // Only reserver or admin can cancel
    if (reservation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền hủy lịch đặt này' });
    }
    
    reservation.status = 'cancelled';
    await reservation.save();
    res.json({ message: 'Đã hủy lịch đặt thành công', reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
