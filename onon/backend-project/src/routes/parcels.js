const express = require('express');
const { getPool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT p.*, s.Name as SenderName, s.Phone as SenderPhone,
             r.Name as ReceiverName, r.Phone as ReceiverPhone
      FROM Parcel p
      LEFT JOIN Sender s ON p.SenderID = s.SenderID
      LEFT JOIN Receiver r ON p.ReceiverID = r.ReceiverID
      ORDER BY p.ParcelID DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/report/summary', async (req, res) => {
  try {
    const pool = getPool();
    const [total] = await pool.query('SELECT COUNT(*) as total FROM Parcel');
    const [totalWeight] = await pool.query('SELECT COALESCE(SUM(Weight), 0) as totalWeight FROM Parcel');
    const [byRoute] = await pool.query(`
      SELECT Departure, Destination, COUNT(*) as count, SUM(Weight) as totalWeight
      FROM Parcel GROUP BY Departure, Destination ORDER BY count DESC
    `);
    const [recent] = await pool.query(`
      SELECT p.*, s.Name as SenderName, r.Name as ReceiverName
      FROM Parcel p
      LEFT JOIN Sender s ON p.SenderID = s.SenderID
      LEFT JOIN Receiver r ON p.ReceiverID = r.ReceiverID
      ORDER BY p.CreatedAt DESC LIMIT 10
    `);
    res.json({
      total: total[0].total,
      totalWeight: totalWeight[0].totalWeight,
      byRoute,
      recent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT p.*, s.Name as SenderName, r.Name as ReceiverName
      FROM Parcel p
      LEFT JOIN Sender s ON p.SenderID = s.SenderID
      LEFT JOIN Receiver r ON p.ReceiverID = r.ReceiverID
      WHERE p.ParcelID = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Parcel not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { Description, Weight, Departure, Destination, SenderID, ReceiverID } = req.body;
    if (!Description || !Weight || !Departure || !Destination) {
      return res.status(400).json({ message: 'Description, Weight, Departure, and Destination are required' });
    }
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO Parcel (Description, Weight, Departure, Destination, SenderID, ReceiverID) VALUES (?, ?, ?, ?, ?, ?)',
      [Description, Weight, Departure, Destination, SenderID || null, ReceiverID || null]
    );
    const [rows] = await pool.query('SELECT * FROM Parcel WHERE ParcelID = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { Description, Weight, Departure, Destination, SenderID, ReceiverID } = req.body;
    if (!Description || !Weight || !Departure || !Destination) {
      return res.status(400).json({ message: 'Description, Weight, Departure, and Destination are required' });
    }
    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE Parcel SET Description = ?, Weight = ?, Departure = ?, Destination = ?, SenderID = ?, ReceiverID = ? WHERE ParcelID = ?',
      [Description, Weight, Departure, Destination, SenderID || null, ReceiverID || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Parcel not found' });
    const [rows] = await pool.query('SELECT * FROM Parcel WHERE ParcelID = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM Parcel WHERE ParcelID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Parcel not found' });
    res.json({ message: 'Parcel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
