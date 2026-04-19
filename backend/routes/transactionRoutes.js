const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Reservation = require('../models/Reservation');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let transactions;
    if (req.user.role === 'admin') {
      transactions = await Transaction.find({}).populate('userId', 'username studentId').populate('productId', 'name image productId');
    } else {
      transactions = await Transaction.find({ userId: req.user.id }).populate('productId', 'name image productId');
    }
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/borrow', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Quyền quản trị không được phép mượn thiết bị' });
    }
    const { productId, returnDate } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.status !== 'available') return res.status(400).json({ message: 'Product is not available' });

    // Reservation restrictions
    const activeReservation = await Reservation.findOne({ productId, status: 'active' });
    if (activeReservation) {
      if (activeReservation.userId.toString() === req.user.id) {
        // If the user borrowing is the reserver, set reservation to completed
        activeReservation.status = 'completed';
        await activeReservation.save();
      } else {
        // If someone else, check overlap
        if (new Date() >= new Date(activeReservation.reservationDate)) {
          return res.status(400).json({ message: 'Thiết bị này đang trong thời gian đặt trước của người khác.' });
        }
        if (new Date(returnDate) > new Date(activeReservation.reservationDate)) {
          return res.status(400).json({ message: `Hạn trả máy không được vượt quá lịch đặt trước (ngày ${new Date(activeReservation.reservationDate).toLocaleString('vi-VN')})` });
        }
      }
    }

    product.status = 'borrowed';
    await product.save();

    const transaction = new Transaction({
      userId: req.user.id,
      productId,
      returnDate
    });

    const createdTransaction = await transaction.save();
    res.status(201).json(createdTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/return', protect, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transaction.findById(transactionId).populate('productId');
    
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.status !== 'borrowing' && transaction.status !== 'overdue' && transaction.status !== 'pending_return') {
      return res.status(400).json({ message: 'Transaction cannot be returned in current status' });
    }

    if (req.user.role === 'admin') {
      // Admin duyệt trả hoặc thu hồi trực tiếp
      transaction.status = 'returned';
      await transaction.save();

      const product = await Product.findById(transaction.productId._id);
      if (product) {
        product.status = 'available';
        await product.save();
      }

      return res.json({ message: 'Đã xác nhận trả máy thành công', transaction });
    } else {
      // User yêu cầu trả máy
      if (transaction.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to return this product' });
      }
      if (transaction.status === 'pending_return') {
        return res.status(400).json({ message: 'Đã gửi yêu cầu trả máy, đang chờ admin duyệt.' });
      }

      transaction.status = 'pending_return';
      await transaction.save();
      
      const User = require('../models/User');
      const Notification = require('../models/Notification');
      const admins = await User.find({ role: 'admin' });
      if (admins && admins.length > 0) {
        const productInfo = await Product.findById(transaction.productId._id);
        const notifications = admins.map(admin => ({
          userId: admin._id,
          message: `🛎️ Yêu cầu duyệt trả máy: User đã gửi yêu cầu trả thiết bị ${productInfo ? productInfo.name : 'Unknown'}. Vui lòng tiếp nhận thiết bị từ sinh viên và Duyệt trả trong mục Transactions!`
        }));
        await Notification.insertMany(notifications);
      }

      return res.json({ message: 'Đã gửi yêu cầu trả máy. Vui lòng chờ Admin duyệt!', transaction });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
