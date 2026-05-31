const express = require('express');
const { getPool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM Sender ORDER BY SenderID DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/report/summary', async (req, res) => {
  try {
    const pool = getPool();
    const [total] = await pool.query('SELECT COUNT(*) as total FROM Sender');
    const [recent] = await pool.query('SELECT * FROM Sender ORDER BY CreatedAt DESC LIMIT 10');
    const [byMonth] = await pool.query(`
      SELECT DATE_FORMAT(CreatedAt, '%Y-%m') as month, COUNT(*) as count
      FROM Sender GROUP BY DATE_FORMAT(CreatedAt, '%Y-%m') ORDER BY month DESC LIMIT 12
    `);
    res.json({ total: total[0].total, recent, byMonth });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM Sender WHERE SenderID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Sender not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { Name, Phone } = req.body;
    if (!Name || !Phone) return res.status(400).json({ message: 'Name and Phone are required' });
    const pool = getPool();
    const [result] = await pool.query('INSERT INTO Sender (Name, Phone) VALUES (?, ?)', [Name, Phone]);
    const [rows] = await pool.query('SELECT * FROM Sender WHERE SenderID = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { Name, Phone } = req.body;
    if (!Name || !Phone) return res.status(400).json({ message: 'Name and Phone are required' });
    const pool = getPool();
    const [result] = await pool.query('UPDATE Sender SET Name = ?, Phone = ? WHERE SenderID = ?', [Name, Phone, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Sender not found' });
    const [rows] = await pool.query('SELECT * FROM Sender WHERE SenderID = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM Sender WHERE SenderID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Sender not found' });
    res.json({ message: 'Sender deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
