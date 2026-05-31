const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const pool = getPool();
    const [users] = await pool.query(
      'SELECT UserID, Username, Email, Password, FullName, Role FROM Users WHERE Username = ? OR Email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    req.session.user = {
      id: user.UserID,
      username: user.Username,
      email: user.Email,
      fullName: user.FullName,
      role: user.Role,
    };

    res.json({
      message: 'Login successful',
      user: req.session.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  }
  return res.status(401).json({ message: 'Not authenticated' });
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const pool = getPool();
    const [existing] = await pool.query(
      'SELECT UserID FROM Users WHERE Username = ? OR Email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO Users (Username, Email, Password, FullName) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, fullName]
    );

    res.status(201).json({ message: 'Registration successful. Please log in.' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

module.exports = router;
