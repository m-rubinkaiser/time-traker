const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Subscription = require('../models/Subscription');
const { getSystemSettings } = require('../config/systemConfig');

const generateToken = async (user) => {
  const systemSettings = await getSystemSettings();
  return jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion || 0 },
    systemSettings.jwtSecret,
    { expiresIn: systemSettings.tokenExpiry || '7d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });

    // Create default user settings
    await Settings.create({ userId: user._id });

    const token = await generateToken(user);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    const token = await generateToken(user);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  // If the user has a subscription, let's append its status
  try {
    const activeSub = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
      expiryDate: { $gte: new Date() }
    });

    res.json({
      ...req.user.toJSON(),
      subscription: activeSub ? {
        planName: activeSub.planName,
        expiryDate: activeSub.expiryDate,
        status: activeSub.status
      } : null
    });
  } catch (err) {
    res.json(req.user);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updated = await user.save();
    const token = await generateToken(updated);
    
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
