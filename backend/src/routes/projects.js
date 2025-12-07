const express = require('express');
const pool = require('../db/pool');
const { authenticateToken, requireAdmin, requireInvestor } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM projects';
    let params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

router.get('/approved', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC',
      ['approved']
    );
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Get approved projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

router.post('/', authenticateToken, requireInvestor, async (req, res) => {
  try {
    const { name, description, location, images, price, goal, token_price, min_investment } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await pool.query(
      `INSERT INTO projects (owner_wallet, name, description, location, images, price, goal, token_price, min_investment, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`,
      [
        req.user.wallet,
        name,
        description || null,
        location || null,
        images || [],
        price || null,
        goal || null,
        token_price || null,
        min_investment || null
      ]
    );

    res.status(201).json({ 
      message: 'Project submitted for approval',
      project: result.rows[0] 
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, images, price, goal, token_price, min_investment } = req.body;

    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];
    
    if (project.owner_wallet !== req.user.wallet && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }

    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           images = COALESCE($4, images),
           price = COALESCE($5, price),
           goal = COALESCE($6, goal),
           token_price = COALESCE($7, token_price),
           min_investment = COALESCE($8, min_investment),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, description, location, images, price, goal, token_price, min_investment, id]
    );

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE projects 
       SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or already processed' });
    }

    res.json({ 
      message: 'Project approved',
      project: result.rows[0] 
    });
  } catch (error) {
    console.error('Approve project error:', error);
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

router.post('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or already processed' });
    }

    res.json({ 
      message: 'Project rejected',
      reason: reason || null,
      project: result.rows[0] 
    });
  } catch (error) {
    console.error('Reject project error:', error);
    res.status(500).json({ error: 'Failed to reject project' });
  }
});

router.post('/:id/change-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'minting', 'building', 'trading'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE projects 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ 
      message: `Project status changed to ${status}`,
      project: result.rows[0] 
    });
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ error: 'Failed to change project status' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ 
      message: 'Project deleted successfully',
      project: result.rows[0] 
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.get('/user/my-projects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE owner_wallet = $1 ORDER BY created_at DESC',
      [req.user.wallet]
    );
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

module.exports = router;
