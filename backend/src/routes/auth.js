const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const { authenticate } = require('../middleware/auth');

// Keep in sync with JWT_EXPIRES_IN's default ('12h') below - the cookie's
// own expiry is separate from the JWT's, so both need to agree
const COOKIE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: COOKIE_MAX_AGE_MS
});

// Register - Create household & admin user
router.post('/register', async (req, res) => {
  const { householdName, email, password, name } = req.body;

  if (!householdName || !email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password minimal 8 karakter' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const household = await prisma.household.create({
      data: { name: householdName }
    });

    // Create default expense categories
    const defaultCategories = [
      { name: 'Makanan & Minuman', icon: 'utensils', color: '#FF6B6B' },
      { name: 'Transportasi', icon: 'car', color: '#4ECDC4' },
      { name: 'Utilitas', icon: 'zap', color: '#FFE66D' },
      { name: 'Kesehatan', icon: 'heart', color: '#FF6B9D' },
      { name: 'Pendidikan', icon: 'book', color: '#95E1D3' },
      { name: 'Hiburan', icon: 'music', color: '#A8E6CF' },
      { name: 'Belanja', icon: 'shopping-bag', color: '#FFB6B9' },
      { name: 'Cicilan', icon: 'credit-card', color: '#FEC8D8' },
      { name: 'Investasi', icon: 'trending-up', color: '#C7CEEA' },
      { name: 'Lainnya', icon: 'folder', color: '#B0E0E6' },
    ];

    await Promise.all(
      defaultCategories.map(cat =>
        prisma.expenseCategory.create({
          data: { ...cat, householdId: household.id }
        })
      )
    );

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        householdId: household.id
      }
    });

    const token = jwt.sign(
      { userId: user.id, householdId: household.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    res.cookie('token', token, cookieOptions());
    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      household: { id: household.id, name: household.name }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, householdId: user.householdId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    const household = await prisma.household.findUnique({
      where: { id: user.householdId }
    });

    res.cookie('token', token, cookieOptions());
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      household: { id: household.id, name: household.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout - clear the auth cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: 'Logged out' });
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, householdId: true, wallpaper: true }
    });

    const household = await prisma.household.findUnique({
      where: { id: req.householdId }
    });

    res.json({ user, household });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// data:image/<type>;base64,<...> only -- keeps wallpaper storage limited to
// actual images, same guard style used elsewhere in the app for photo uploads.
const isValidImageDataUri = (value) => /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(value);

// Update own profile (currently just the personal dashboard wallpaper)
router.put('/me', authenticate, async (req, res) => {
  const { wallpaper } = req.body;

  if (wallpaper !== undefined && wallpaper !== null && !isValidImageDataUri(wallpaper)) {
    return res.status(400).json({ error: 'Wallpaper harus berupa gambar (PNG/JPG/WEBP/GIF)' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { wallpaper: wallpaper ?? null },
      select: { id: true, email: true, name: true, role: true, householdId: true, wallpaper: true }
    });
    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
