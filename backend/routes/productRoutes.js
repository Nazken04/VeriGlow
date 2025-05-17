const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authMiddleware, productController.registerProduct);

router.get('/:productId', productController.getProductDetails);

router.post('/verify', authMiddleware, productController.verifyProduct);

router.get('/manufacturer/reports', authMiddleware, productController.getManufacturerReports);

router.get('/manufacturer/products', authMiddleware, productController.getManufacturerProducts)
router.get('/batch/:batchNumber', authMiddleware, productController.getProductsByBatchNumber);
module.exports = router;
