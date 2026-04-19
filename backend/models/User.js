const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  studentId: { type: String, sparse: true, unique: true },
  avatar: { type: String },
  phone: { type: String },
  address: { type: String },
  className: { type: String },
  course: { type: String },
  major: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
