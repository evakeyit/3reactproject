const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await connection.execute('CREATE DATABASE IF NOT EXISTS CRPMS');
    await connection.end();

    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'CRPMS',
    });

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Services (
        ServiceCode VARCHAR(50) PRIMARY KEY,
        ServiceName VARCHAR(255) NOT NULL,
        ServicePrice DECIMAL(10, 2) NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Car (
        PlateNumber VARCHAR(50) PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        Model VARCHAR(100) NOT NULL,
        ManufacturingYear INT NOT NULL,
        DriverPhone VARCHAR(20) NOT NULL,
        MechanicName VARCHAR(255) NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ServiceRecord (
        RecordNumber VARCHAR(50) PRIMARY KEY,
        SeviceDate DATE NOT NULL,
        PlateNumber VARCHAR(50),
        ServiceCode VARCHAR(50),
        FOREIGN KEY (PlateNumber) REFERENCES Car(PlateNumber),
        FOREIGN KEY (ServiceCode) REFERENCES Services(ServiceCode)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Payment (
        PaymentNumber VARCHAR(50) PRIMARY KEY,
        AmountPaid DECIMAL(10, 2) NOT NULL,
        PaymentDate DATE NOT NULL,
        RecordNumber VARCHAR(50),
        FOREIGN KEY (RecordNumber) REFERENCES ServiceRecord(RecordNumber)
      )
    `);

    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = initDatabase;
