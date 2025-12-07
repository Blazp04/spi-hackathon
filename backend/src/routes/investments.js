const express = require('express');
const pool = require('../db/pool');
const { authenticateToken, requireInvestor } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, requireInvestor, async (req, res) => {
  try {
    const { project_id, amount, tx_hash } = req.body;

    if (!project_id || !amount) {
      return res.status(400).json({ error: 'Project ID and amount are required' });
    }

    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [project_id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    if (!['approved', 'minting'].includes(project.status)) {
      return res.status(400).json({ error: 'Project is not available for minting' });
    }

    if (project.min_investment && amount < project.min_investment) {
      return res.status(400).json({ 
        error: `Minimum investment is €${project.min_investment}` 
      });
    }

    const result = await pool.query(
      `INSERT INTO investments (project_id, investor_wallet, amount, tx_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [project_id, req.user.wallet, amount, tx_hash]
    );

    await pool.query(
      `UPDATE projects 
       SET current_funding = COALESCE(current_funding, 0) + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [amount, project_id]
    );

    res.status(201).json({ 
      message: 'Investment successful',
      investment: result.rows[0] 
    });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

router.get('/my-investments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, p.name, p.location, p.images, p.token_price 
       FROM investments i
       JOIN projects p ON i.project_id = p.id
       WHERE i.investor_wallet = $1
       ORDER BY i.created_at DESC`,
      [req.user.wallet]
    );
    res.json({ investments: result.rows });
  } catch (error) {
    console.error('Get my investments error:', error);
    res.status(500).json({ error: 'Failed to get investments' });
  }
});

router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await pool.query(
      `SELECT i.*, u.wallet 
       FROM investments i
       JOIN users u ON i.investor_wallet = u.wallet
       WHERE i.project_id = $1
       ORDER BY i.created_at DESC`,
      [projectId]
    );
    res.json({ investments: result.rows });
  } catch (error) {
    console.error('Get project investments error:', error);
    res.status(500).json({ error: 'Failed to get investments' });
  }
});

module.exports = router;
