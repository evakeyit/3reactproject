const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const initDatabase = require('./database');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let db;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    res.status(201).json({ id: result.insertId, username });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const [services] = await db.execute('SELECT * FROM Services');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/services', authenticateToken, async (req, res) => {
  try {
    const { ServiceCode, ServiceName, ServicePrice } = req.body;
    await db.execute(
      'INSERT INTO Services (ServiceCode, ServiceName, ServicePrice) VALUES (?, ?, ?)',
      [ServiceCode, ServiceName, ServicePrice]
    );
    res.status(201).json({ ServiceCode, ServiceName, ServicePrice });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Service code already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/services/:id', authenticateToken, async (req, res) => {
  try {
    const { ServiceName, ServicePrice } = req.body;
    await db.execute(
      'UPDATE Services SET ServiceName = ?, ServicePrice = ? WHERE ServiceCode = ?',
      [ServiceName, ServicePrice, req.params.id]
    );
    res.json({ ServiceCode: req.params.id, ServiceName, ServicePrice });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/services/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM Services WHERE ServiceCode = ?', [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/cars', authenticateToken, async (req, res) => {
  try {
    const [cars] = await db.execute('SELECT * FROM Car');
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/cars', authenticateToken, async (req, res) => {
  try {
    const { PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName } = req.body;
    await db.execute(
      'INSERT INTO Car (PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName) VALUES (?, ?, ?, ?, ?, ?)',
      [PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName]
    );
    res.status(201).json({ PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Plate number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const { type, Model, ManufacturingYear, DriverPhone, MechanicName } = req.body;
    await db.execute(
      'UPDATE Car SET type = ?, Model = ?, ManufacturingYear = ?, DriverPhone = ?, MechanicName = ? WHERE PlateNumber = ?',
      [type, Model, ManufacturingYear, DriverPhone, MechanicName, req.params.id]
    );
    res.json({ PlateNumber: req.params.id, type, Model, ManufacturingYear, DriverPhone, MechanicName });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM Car WHERE PlateNumber = ?', [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/servicerecords', authenticateToken, async (req, res) => {
  try {
    const [records] = await db.execute(`
      SELECT sr.*, c.type as CarType, c.Model, s.ServiceName 
      FROM ServiceRecord sr
      LEFT JOIN Car c ON sr.PlateNumber = c.PlateNumber
      LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
    `);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/servicerecords', authenticateToken, async (req, res) => {
  try {
    const { RecordNumber, SeviceDate, PlateNumber, ServiceCode } = req.body;
    await db.execute(
      'INSERT INTO ServiceRecord (RecordNumber, SeviceDate, PlateNumber, ServiceCode) VALUES (?, ?, ?, ?)',
      [RecordNumber, SeviceDate, PlateNumber, ServiceCode]
    );
    res.status(201).json({ RecordNumber, SeviceDate, PlateNumber, ServiceCode });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Record number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/servicerecords/:id', authenticateToken, async (req, res) => {
  try {
    const { SeviceDate, PlateNumber, ServiceCode } = req.body;
    await db.execute(
      'UPDATE ServiceRecord SET SeviceDate = ?, PlateNumber = ?, ServiceCode = ? WHERE RecordNumber = ?',
      [SeviceDate, PlateNumber, ServiceCode, req.params.id]
    );
    res.json({ RecordNumber: req.params.id, SeviceDate, PlateNumber, ServiceCode });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/servicerecords/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM ServiceRecord WHERE RecordNumber = ?', [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const [payments] = await db.execute(`
      SELECT p.*, sr.SeviceDate, c.PlateNumber, s.ServiceName
      FROM Payment p
      LEFT JOIN ServiceRecord sr ON p.RecordNumber = sr.RecordNumber
      LEFT JOIN Car c ON sr.PlateNumber = c.PlateNumber
      LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
    `);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { PaymentNumber, AmountPaid, PaymentDate, RecordNumber } = req.body;
    await db.execute(
      'INSERT INTO Payment (PaymentNumber, AmountPaid, PaymentDate, RecordNumber) VALUES (?, ?, ?, ?)',
      [PaymentNumber, AmountPaid, PaymentDate, RecordNumber]
    );
    res.status(201).json({ PaymentNumber, AmountPaid, PaymentDate, RecordNumber });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Payment number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { AmountPaid, PaymentDate, RecordNumber } = req.body;
    await db.execute(
      'UPDATE Payment SET AmountPaid = ?, PaymentDate = ?, RecordNumber = ? WHERE PaymentNumber = ?',
      [AmountPaid, PaymentDate, RecordNumber, req.params.id]
    );
    res.json({ PaymentNumber: req.params.id, AmountPaid, PaymentDate, RecordNumber });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM Payment WHERE PaymentNumber = ?', [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const [totalServices] = await db.execute('SELECT COUNT(*) as count FROM Services');
    const [totalCars] = await db.execute('SELECT COUNT(*) as count FROM Car');
    const [totalRecords] = await db.execute('SELECT COUNT(*) as count FROM ServiceRecord');
    const [totalPayments] = await db.execute('SELECT SUM(AmountPaid) as total FROM Payment');
    const [recentRecords] = await db.execute(`
      SELECT sr.*, c.PlateNumber, s.ServiceName
      FROM ServiceRecord sr
      LEFT JOIN Car c ON sr.PlateNumber = c.PlateNumber
      LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
      ORDER BY sr.SeviceDate DESC
      LIMIT 10
    `);
    const [recentPayments] = await db.execute(`
      SELECT p.*, sr.SeviceDate, c.PlateNumber
      FROM Payment p
      LEFT JOIN ServiceRecord sr ON p.RecordNumber = sr.RecordNumber
      LEFT JOIN Car c ON sr.PlateNumber = c.PlateNumber
      ORDER BY p.PaymentDate DESC
      LIMIT 10
    `);

    res.json({
      totalServices: totalServices[0].count,
      totalCars: totalCars[0].count,
      totalRecords: totalRecords[0].count,
      totalPayments: totalPayments[0].total || 0,
      recentRecords,
      recentPayments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const startServer = async () => {
  try {
    db = await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
