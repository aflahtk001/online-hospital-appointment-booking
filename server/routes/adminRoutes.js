const express = require('express');
const router = express.Router();
const { getSystemStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/stats')
    .get(protect, authorize('super_admin'), getSystemStats);

module.exports = router;
