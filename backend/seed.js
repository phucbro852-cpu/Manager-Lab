const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const Notification = require('./models/Notification');

dotenv.config();

const importData = async () => {
  try {
    console.log('Đang kết nối tới MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab-management', { family: 4 });
    console.log('Đã kết nối thành công!');
    await User.deleteMany();
    await Product.deleteMany();
    await Transaction.deleteMany();
    await Notification.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
    const hashedUserPassword = await bcrypt.hash('user123', salt);

    const createdUsers = await User.insertMany([
      { username: 'admin', password: hashedAdminPassword, role: 'admin' },
      { username: 'user', password: hashedUserPassword, role: 'user' },
    ]);

    const adminId = createdUsers[0]._id;

    const products = [
      {
        productId: 'P001',
        name: 'Oscilloscope',
        description: 'Máy hiện sóng số 100MHz',
        status: 'available',
        image: 'https://via.placeholder.com/150',
      },
      {
        productId: 'P002',
        name: 'Multimeter',
        description: 'Đồng hồ vạn năng điện tử',
        status: 'borrowed',
        image: 'https://via.placeholder.com/150',
      },
      {
        productId: 'P003',
        name: 'Function Generator',
        description: 'Máy phát xung tín hiệu',
        status: 'maintenance',
        image: 'https://via.placeholder.com/150',
      }
    ];

    const insertedProducts = await Product.insertMany(products);

    // After insert, update QR code link based on productId
    for (const prod of insertedProducts) {
      prod.qrCode = `http://localhost:3000/product/${prod.productId}`;
      await prod.save();
    }

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
