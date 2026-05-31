const express = require('express');
const { getPool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/dashboard', async (req, res) => {
  try {
    const pool = getPool();
    const [senders] = await pool.query('SELECT COUNT(*) as count FROM Sender');
    const [receivers] = await pool.query('SELECT COUNT(*) as count FROM Receiver');
    const [parcels] = await pool.query('SELECT COUNT(*) as count FROM Parcel');
    const [records] = await pool.query('SELECT COUNT(*) as count FROM ParcelRecord');
    const [payments] = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(Amount), 0) as total FROM Payment');
    const [pending] = await pool.query("SELECT COUNT(*) as count FROM ParcelRecord WHERE DeliveryStatus = 'Pending'");
    const [inTransit] = await pool.query("SELECT COUNT(*) as count FROM ParcelRecord WHERE DeliveryStatus = 'In Transit'");
    const [delivered] = await pool.query("SELECT COUNT(*) as count FROM ParcelRecord WHERE DeliveryStatus = 'Delivered'");
    const [recentRecords] = await pool.query(`
      SELECT pr.*, p.Description, p.Departure, p.Destination
      FROM ParcelRecord pr
      JOIN Parcel p ON pr.ParcelID = p.ParcelID
      ORDER BY pr.RecordDate DESC LIMIT 5
    `);

    res.json({
      stats: {
        senders: senders[0].count,
        receivers: receivers[0].count,
        parcels: parcels[0].count,
        records: records[0].count,
        payments: payments[0].count,
        totalRevenue: payments[0].total,
        pending: pending[0].count,
        inTransit: inTransit[0].count,
        delivered: delivered[0].count,
      },
      recentRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
