require('dotenv').config();
const pool = require('./pool');

const addCurrentFunding = async () => {
  try {
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='projects' AND column_name='current_funding';
    `);

    if (checkColumn.rows.length === 0) {
      await pool.query(`
        ALTER TABLE projects 
        ADD COLUMN current_funding DECIMAL(15, 2) DEFAULT 0;
      `);
      console.log('✓ Added current_funding column to projects table');
    } else {
      console.log('✓ current_funding column already exists');
    }

    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

addCurrentFunding();
