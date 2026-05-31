const express = require('express');
const { getPool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT pay.*, pr.TransportFee, pr.PaymentStatus, pr.DeliveryStatus,
             p.Description, p.Departure, p.Destination
      FROM Payment pay
      JOIN ParcelRecord pr ON pay.RecordID = pr.RecordID
      JOIN Parcel p ON pr.ParcelID = p.ParcelID
      ORDER BY pay.PaymentID DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/report/summary', async (req, res) => {
  try {
    const pool = getPool();
    const [total] = await pool.query('SELECT COUNT(*) as total FROM Payment');
    const [totalAmount] = await pool.query('SELECT COALESCE(SUM(Amount), 0) as totalAmount FROM Payment');
    const [byMonth] = await pool.query(`
      SELECT DATE_FORMAT(PaymentDate, '%Y-%m') as month, COUNT(*) as count, SUM(Amount) as totalAmount
      FROM Payment GROUP BY DATE_FORMAT(PaymentDate, '%Y-%m') ORDER BY month DESC LIMIT 12
    `);
    const [byReceiver] = await pool.query(`
      SELECT ReceivedBy, COUNT(*) as count, SUM(Amount) as totalAmount
      FROM Payment GROUP BY ReceivedBy ORDER BY totalAmount DESC
    `);
    const [recent] = await pool.query(`
      SELECT pay.*, p.Description FROM Payment pay
      JOIN ParcelRecord pr ON pay.RecordID = pr.RecordID
      JOIN Parcel p ON pr.ParcelID = p.ParcelID
      ORDER BY pay.PaymentDate DESC LIMIT 10
    `);
    res.json({
      total: total[0].total,
      totalAmount: totalAmount[0].totalAmount,
      byMonth,
      byReceiver,
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
      SELECT pay.*, pr.TransportFee, p.Description
      FROM Payment pay
      JOIN ParcelRecord pr ON pay.RecordID = pr.RecordID
      JOIN Parcel p ON pr.ParcelID = p.ParcelID
      WHERE pay.PaymentID = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Payment not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { RecordID, PaymentDate, Amount, ReceivedBy } = req.body;
    if (!RecordID || !PaymentDate || !ReceivedBy) {
      return res.status(400).json({ message: 'RecordID, PaymentDate, and ReceivedBy are required' });
    }
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        'INSERT INTO Payment (RecordID, PaymentDate, Amount, ReceivedBy) VALUES (?, ?, ?, ?)',
        [RecordID, PaymentDate, Amount || 0, ReceivedBy]
      );

      const [payments] = await conn.query(
        'SELECT COALESCE(SUM(Amount), 0) as paid FROM Payment WHERE RecordID = ?',
        [RecordID]
      );
      const [record] = await conn.query('SELECT TransportFee FROM ParcelRecord WHERE RecordID = ?', [RecordID]);
      const paid = parseFloat(payments[0].paid);
      const fee = parseFloat(record[0].TransportFee);
      let paymentStatus = 'Unpaid';
      if (paid >= fee && fee > 0) paymentStatus = 'Paid';
      else if (paid > 0) paymentStatus = 'Partial';

      await conn.query('UPDATE ParcelRecord SET PaymentStatus = ? WHERE RecordID = ?', [paymentStatus, RecordID]);
      await conn.commit();

      const [rows] = await pool.query('SELECT * FROM Payment WHERE PaymentID = ?', [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { RecordID, PaymentDate, Amount, ReceivedBy } = req.body;
    if (!RecordID || !PaymentDate || !ReceivedBy) {
      return res.status(400).json({ message: 'RecordID, PaymentDate, and ReceivedBy are required' });
    }
    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE Payment SET RecordID = ?, PaymentDate = ?, Amount = ?, ReceivedBy = ? WHERE PaymentID = ?',
      [RecordID, PaymentDate, Amount || 0, ReceivedBy, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment not found' });
    const [rows] = await pool.query('SELECT * FROM Payment WHERE PaymentID = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM Payment WHERE PaymentID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
