const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.address = req.body.address !== undefined ? req.body.address : user.address;
      
      if (req.user.role === 'admin') {
        user.className = req.body.className !== undefined ? req.body.className : user.className;
        user.course = req.body.course !== undefined ? req.body.course : user.course;
        user.major = req.body.major !== undefined ? req.body.major : user.major;
      }

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        address: updatedUser.address,
        className: updatedUser.className,
        course: updatedUser.course,
        major: updatedUser.major
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  const { username, password, role, phone, className, course, major, avatar, studentId } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    if (studentId) {
      const studentIdExists = await User.findOne({ studentId });
      if (studentIdExists) return res.status(400).json({ message: 'Student ID already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'user',
      phone,
      className,
      course,
      major,
      avatar,
      studentId
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.username = req.body.username || user.username;
      user.role = req.body.role || user.role;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.className = req.body.className !== undefined ? req.body.className : user.className;
      user.course = req.body.course !== undefined ? req.body.course : user.course;
      user.major = req.body.major !== undefined ? req.body.major : user.major;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
      user.studentId = req.body.studentId !== undefined ? req.body.studentId : user.studentId;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
