require('dotenv').config();
const pool = require('./pool');

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        wallet VARCHAR(42) UNIQUE NOT NULL,
        role VARCHAR(20) DEFAULT 'INVESTOR',
        nonce VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        owner_wallet VARCHAR(42) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        images TEXT[], 
        price DECIMAL(15, 2),
        goal DECIMAL(15, 2),
        token_price DECIMAL(15, 2),
        min_investment DECIMAL(15, 2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Projects table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        investor_wallet VARCHAR(42) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Investments table created');

    console.log('\nDatabase initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDB();
