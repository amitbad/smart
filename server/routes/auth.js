import express from 'express';
import bcrypt from 'bcrypt';
import { getDB, getDBType } from '../db/index.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDB();
    const user = await db.findOne('users', { username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      id: user.id || user._id,
      username: user.username,
      role: user.role,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Username, current password, and new password are required'
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        error: 'New password must be at least 4 characters long'
      });
    }

    const db = getDB();
    const user = await db.findOne('users', { username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const userId = user.id || user._id;
    await db.update('users', userId, { password: hashedNewPassword, updated_at: new Date() });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password update failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (!['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be ADMIN or USER' });
    }

    const db = getDB();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.create('users', {
      username,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      id: newUser.id || newUser._id,
      username: newUser.username,
      role: newUser.role,
      message: 'User created successfully'
    });
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
