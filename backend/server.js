const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

const Transaction = require('./models/Transaction');
const Product = require('./models/Product');
const Notification = require('./models/Notification');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab-management', { family: 4 })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reservations', reservationRoutes);

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Background Job: Check for Overdue Transactions Every Minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const overdueTransactions = await Transaction.find({
      status: 'borrowing',
      returnDate: { $lt: now }
    }).populate('productId');

    for (const t of overdueTransactions) {
      t.status = 'overdue';
      await t.save();

      if (t.productId) {
         await Product.findByIdAndUpdate(t.productId._id, { status: 'overdue' });
         
         const notification = new Notification({
           userId: t.userId,
           message: `⚠️ Lời Nhắc: Thiết bị ${t.productId.name} bạn mượn đã bị QUÁ HẠN trả. Vui lòng hoàn trả tại phòng Lab ngay!`
         });
         await notification.save();
      }
    }
    if (overdueTransactions.length > 0) {
      console.log(`[Cron] Processed ${overdueTransactions.length} newly overdue transactions.`);
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
