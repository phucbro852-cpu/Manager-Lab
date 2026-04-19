const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  cpu: { type: String },
  ram: { type: String },
  ssd: { type: String },
  status: { type: String, enum: ['available', 'borrowed', 'maintenance', 'overdue'], default: 'available' },
  image: { type: String },
  qrCode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
