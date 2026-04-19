const express = require('express');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }
    
    if (!product) {
      product = await Product.findOne({ productId: id });
    }

    if (product) {
      let productData = product.toObject();
      if (productData.status === 'borrowed' || productData.status === 'overdue') {
        const Transaction = require('../models/Transaction');
        const activeTrans = await Transaction.findOne({ productId: product._id, status: { $in: ['borrowing', 'overdue'] } });
        if (activeTrans && activeTrans.returnDate) {
          productData.activeTransactionReturnDate = activeTrans.returnDate;
        }
      }
      res.json(productData);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { productId, name, description, cpu, ram, ssd, image } = req.body;
    
    // Check constraints
    if (!productId) return res.status(400).json({ message: 'Product ID is required' });
    const exists = await Product.findOne({ productId });
    if (exists) return res.status(400).json({ message: 'Product ID already exists' });

    const product = new Product({
      productId,
      name,
      description,
      cpu,
      ram,
      ssd,
      image,
      status: 'available',
    });
    
    // Auto-generate a dummy QR code mapping
    product.qrCode = `http://localhost:3000/product/${product.productId}`;
    
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { productId, name, description, cpu, ram, ssd, image, status } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      if (productId && productId !== product.productId) {
        const exists = await Product.findOne({ productId });
        if (exists) return res.status(400).json({ message: 'Product ID already exists' });
        product.productId = productId;
        product.qrCode = `http://localhost:3000/product/${productId}`;
      }

      product.name = name || product.name;
      product.description = description || product.description;
      product.cpu = cpu !== undefined ? cpu : product.cpu;
      product.ram = ram !== undefined ? ram : product.ram;
      product.ssd = ssd !== undefined ? ssd : product.ssd;
      product.image = image !== undefined ? image : product.image;
      product.status = status || product.status;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
