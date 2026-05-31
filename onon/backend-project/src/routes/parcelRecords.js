const express = require('express');
const { getPool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT pr.*, p.Description, p.Departure, p.Destination, p.Weight,
             s.Name as SenderName, r.Name as ReceiverName
      FROM ParcelRecord pr
      JOIN Parcel p ON pr.ParcelID = p.ParcelID
      LEFT JOIN Sender s ON p.SenderID = s.SenderID
      LEFT JOIN Receiver r ON p.ReceiverID = r.ReceiverID
      ORDER BY pr.RecordID DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/report/summary', async (req, res) => {
  try {
    const pool = getPool();
    const [total] = await pool.query('SELECT COUNT(*) as total FROM ParcelRecord');
    const [byDelivery] = await pool.query(`
      SELECT DeliveryStatus, COUNT(*) as count FROM ParcelRecord GROUP BY DeliveryStatus
    `);
    const [byPayment] = await pool.query(`
      SELECT PaymentStatus, COUNT(*) as count FROM ParcelRecord GROUP BY PaymentStatus
    `);
    const [revenue] = await pool.query(`
      SELECT COALESCE(SUM(TransportFee), 0) as totalRevenue FROM ParcelRecord
    `);
    const [recent] = await pool.query(`
      SELECT pr.*, p.Description, p.Departure, p.Destination
      FROM ParcelRecord pr
      JOIN Parcel p ON pr.ParcelID = p.ParcelID
      ORDER BY pr.RecordDate DESC LIMIT 10
    `);
    res.json({
      total: total[0].total,
      byDelivery,
      byPayment,
      totalRevenue: revenue[0].totalRevenue,
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
      SELECT pr.*, p.Description, p.Departure, p.Destination
      FROM ParcelRecord pr
      JOIN Parcel p ON pr.ParcelID = p.ParcelID
      WHERE pr.RecordID = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { ParcelID, RecordDate, TransportFee, DeliveryStatus, PaymentStatus } = req.body;
    if (!ParcelID || !RecordDate) {
      return res.status(400).json({ message: 'ParcelID and RecordDate are required' });
    }
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO ParcelRecord (ParcelID, RecordDate, TransportFee, DeliveryStatus, PaymentStatus) VALUES (?, ?, ?, ?, ?)',
      [ParcelID, RecordDate, TransportFee || 0, DeliveryStatus || 'Pending', PaymentStatus || 'Unpaid']
    );
    const [rows] = await pool.query('SELECT * FROM ParcelRecord WHERE RecordID = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { ParcelID, RecordDate, TransportFee, DeliveryStatus, PaymentStatus } = req.body;
    if (!ParcelID || !RecordDate) {
      return res.status(400).json({ message: 'ParcelID and RecordDate are required' });
    }
    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE ParcelRecord SET ParcelID = ?, RecordDate = ?, TransportFee = ?, DeliveryStatus = ?, PaymentStatus = ? WHERE RecordID = ?',
      [ParcelID, RecordDate, TransportFee || 0, DeliveryStatus, PaymentStatus, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Record not found' });
    const [rows] = await pool.query('SELECT * FROM ParcelRecord WHERE RecordID = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM ParcelRecord WHERE RecordID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
