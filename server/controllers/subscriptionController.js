const Subscription = require('../models/Subscription');
const SystemSettings = require('../models/SystemSettings');
const { getSystemSettings } = require('../config/systemConfig');
const axios = require('axios');

// Helper to get Cashfree base URL based on config
const getCashfreeBaseUrl = () => {
  return process.env.CASHFREE_ENV === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
};

// @desc    Get current user's subscription details
// @route   GET /api/subscription/status
const getSubscriptionStatus = async (req, res) => {
  try {
    const activeSub = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
      expiryDate: { $gte: new Date() }
    });

    const history = await Subscription.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      active: !!activeSub,
      subscription: activeSub,
      history
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Initiate payment checkout (Cashfree or Mock fallback)
// @route   POST /api/subscription/checkout
const checkout = async (req, res) => {
  try {
    const systemSettings = await getSystemSettings();
    const amount = systemSettings.subscriptionAmount || 50;

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

    // Developer Mode / Mock Fallback if Cashfree is not fully set up
    if (!clientId || !clientSecret || clientId === 'your_cashfree_client_id') {
      console.log('[Subscription] Cashfree keys missing. Using Developer Mock Checkout.');
      return res.json({
        success: true,
        mock: true,
        paymentUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscribe?mock_success=true&order_id=mock_order_${Date.now()}`
      });
    }

    const orderId = `order_${Date.now()}`;
    const returnUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscribe?order_id={order_id}`;

    console.log(`[Subscription] Initiating Cashfree Checkout for order ${orderId}...`);
    
    const response = await axios.post(
      `${getCashfreeBaseUrl()}/orders`,
      {
        order_id: orderId,
        order_amount: parseFloat(amount.toFixed(2)),
        order_currency: 'INR',
        customer_details: {
          customer_id: req.user._id.toString(),
          customer_email: req.user.email,
          customer_phone: '9999999999'
        },
        order_meta: {
          return_url: returnUrl
        }
      },
      {
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': clientId,
          'x-client-secret': clientSecret,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentSessionId = response.data.payment_session_id;
    let paymentUrl = response.data.payment_link || response.data.payments?.url;

    if (!paymentUrl && paymentSessionId) {
      if (process.env.CASHFREE_ENV === 'PRODUCTION') {
        paymentUrl = `https://payments.cashfree.com/order/#${paymentSessionId}`;
      } else {
        paymentUrl = `https://payments-test.cashfree.com/order/#${paymentSessionId}`;
      }
    }

    res.json({
      success: true,
      mock: false,
      paymentSessionId,
      mode: process.env.CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox'
    });
  } catch (err) {
    console.error('[Subscription] Cashfree Order creation failed:', err.response?.data || err.message);
    res.status(500).json({ message: err.response?.data?.message || 'Failed to initiate payment checkout' });
  }
};

// @desc    Verify Cashfree / Mock payment status and activate subscription
// @route   POST /api/subscription/verify
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Order ID required' });

    let isPaid = false;
    let paymentAmount = 50;

    // Handle Mock activation only if Cashfree keys are not configured
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    const hasKeys = clientId && clientSecret && clientId !== 'your_cashfree_client_id';

    if (orderId.startsWith('mock_order_')) {
      if (hasKeys) {
        return res.status(400).json({ message: 'Real payment credentials are configured. Mock payments are disabled.' });
      }
      isPaid = true;
      const settings = await getSystemSettings();
      paymentAmount = settings.subscriptionAmount || 50;
    } else {

      const response = await axios.get(
        `${getCashfreeBaseUrl()}/orders/${orderId}`,
        {
          headers: {
            'x-api-version': '2023-08-01',
            'x-client-id': clientId,
            'x-client-secret': clientSecret
          }
        }
      );

      const status = response.data.order_status;
      if (status === 'PAID') {
        isPaid = true;
        paymentAmount = response.data.order_amount;
      }
    }

    if (!isPaid) {
      return res.status(400).json({ message: 'Payment verification failed or unpaid.' });
    }

    // Check if subscription for this order already exists to prevent duplicate activations
    const existingSub = await Subscription.findOne({ userId: req.user._id, planName: `Paid Plan (${orderId})` });
    if (existingSub) {
      return res.json({ success: true, message: 'Subscription already active' });
    }

    // Find current active subscription to queue end date if applicable
    const existingActive = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
      expiryDate: { $gte: new Date() }
    });

    let startDate = new Date();
    if (existingActive) {
      startDate = new Date(existingActive.expiryDate);
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days extension

    if (!existingActive) {
      await Subscription.updateMany(
        { userId: req.user._id, status: 'active' },
        { status: 'expired' }
      );
    }

    const subscription = await Subscription.create({
      userId: req.user._id,
      planName: orderId.startsWith('mock_order_') ? 'Paid Plan (Mock)' : `Paid Plan (${orderId})`,
      amount: paymentAmount,
      startDate,
      expiryDate,
      paymentStatus: 'completed',
      status: 'active'
    });

    res.json({
      success: true,
      message: 'Subscription successfully activated!',
      subscription
    });
  } catch (err) {
    console.error('[Subscription] Payment verification failed:', err.response?.data || err.message);
    res.status(500).json({ message: err.response?.data?.message || 'Payment verification failed' });
  }
};

// @desc    Activate subscription via promo/activation token (Admin generated/saved)
// @route   POST /api/subscription/activate-token
const activateToken = async (req, res) => {
  try {
    const { token } = req.body;
    const systemSettings = await getSystemSettings();
    const expectedToken = systemSettings.activationToken || 'RUBIN-ACTIVATE';
    
    if (token !== expectedToken) {
      return res.status(400).json({ message: 'Invalid activation token' });
    }

    const existingActive = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
      expiryDate: { $gte: new Date() }
    });

    let startDate = new Date();
    if (existingActive) {
      startDate = new Date(existingActive.expiryDate);
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + 30);

    if (!existingActive) {
      await Subscription.updateMany(
        { userId: req.user._id, status: 'active' },
        { status: 'expired' }
      );
    }

    const subscription = await Subscription.create({
      userId: req.user._id,
      planName: 'Paid Plan (Token Activated)',
      amount: 0,
      startDate,
      expiryDate,
      paymentStatus: 'completed',
      status: 'active'
    });

    res.json({
      success: true,
      message: 'Subscription activated using token successfully!',
      subscription
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getSubscriptionStatus,
  checkout,
  verifyPayment,
  activateToken
};
