const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
  });

  const dbName = process.env.DB_NAME || 'PDMS';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.end();

  pool = mysql.createPool({ ...dbConfig, database: dbName });

  await createTables();
  await seedDefaultUser();

  console.log(`Database "${dbName}" initialized successfully`);
  return pool;
}

async function createTables() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS Users (
        UserID INT AUTO_INCREMENT PRIMARY KEY,
        Username VARCHAR(100) NOT NULL UNIQUE,
        Email VARCHAR(150) NOT NULL UNIQUE,
        Password VARCHAR(255) NOT NULL,
        FullName VARCHAR(150) NOT NULL,
        Role ENUM('admin', 'staff') DEFAULT 'staff',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS Sender (
        SenderID INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(150) NOT NULL,
        Phone VARCHAR(20) NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS Receiver (
        ReceiverID INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(150) NOT NULL,
        Phone VARCHAR(20) NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS Parcel (
        ParcelID INT AUTO_INCREMENT PRIMARY KEY,
        Description TEXT NOT NULL,
        Weight DECIMAL(10,2) NOT NULL,
        Departure VARCHAR(100) NOT NULL,
        Destination VARCHAR(100) NOT NULL,
        SenderID INT,
        ReceiverID INT,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (SenderID) REFERENCES Sender(SenderID) ON DELETE SET NULL,
        FOREIGN KEY (ReceiverID) REFERENCES Receiver(ReceiverID) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ParcelRecord (
        RecordID INT AUTO_INCREMENT PRIMARY KEY,
        ParcelID INT NOT NULL,
        RecordDate DATE NOT NULL,
        TransportFee DECIMAL(10,2) NOT NULL DEFAULT 0,
        DeliveryStatus ENUM('Pending', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Pending',
        PaymentStatus ENUM('Unpaid', 'Partial', 'Paid') DEFAULT 'Unpaid',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ParcelID) REFERENCES Parcel(ParcelID) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS Payment (
        PaymentID INT AUTO_INCREMENT PRIMARY KEY,
        RecordID INT NOT NULL,
        PaymentDate DATE NOT NULL,
        Amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        ReceivedBy VARCHAR(150) NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (RecordID) REFERENCES ParcelRecord(RecordID) ON DELETE CASCADE
      )
    `);
  } finally {
    conn.release();
  }
}

async function seedDefaultUser() {
  const bcrypt = require('bcryptjs');
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM Users');
    if (rows[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await conn.query(
        'INSERT INTO Users (Username, Email, Password, FullName, Role) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@transitpro.rw', hashedPassword, 'System Administrator', 'admin']
      );
      console.log('Default admin user created (username: admin, password: admin123)');
    }
  } finally {
    conn.release();
  }
}

function getPool() {
  if (!pool) throw new Error('Database not initialized');
  return pool;
}

module.exports = { initializeDatabase, getPool };
