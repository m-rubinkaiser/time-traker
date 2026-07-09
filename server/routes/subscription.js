const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSubscriptionStatus, checkout, activateToken, verifyPayment } = require('../controllers/subscriptionController');

router.use(protect);

router.get('/status', getSubscriptionStatus);
router.post('/checkout', checkout);
router.post('/activate-token', activateToken);
router.post('/verify', verifyPayment);

module.exports = router;
