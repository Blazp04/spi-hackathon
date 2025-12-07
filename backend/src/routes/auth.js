const express = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/nonce', async (req, res) => {
  try {
    const { wallet } = req.body;
    
    if (!wallet || !ethers.isAddress(wallet)) {
      return res.status(400).json({ error: 'Valid wallet address required' });
    }

    const walletLower = wallet.toLowerCase();
    const nonce = `Sign this message to login to BlockByBlock: ${uuidv4()}`;

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE wallet = $1',
      [walletLower]
    );

    if (existingUser.rows.length === 0) {
      const role = walletLower === process.env.ADMIN_WALLET?.toLowerCase() 
        ? 'ADMIN' 
        : 'INVESTOR';
      
      await pool.query(
        'INSERT INTO users (wallet, role, nonce) VALUES ($1, $2, $3)',
        [walletLower, role, nonce]
      );
    } else {
      await pool.query(
        'UPDATE users SET nonce = $1, updated_at = CURRENT_TIMESTAMP WHERE wallet = $2',
        [nonce, walletLower]
      );
    }

    res.json({ nonce });
  } catch (error) {
    console.error('Nonce error:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { wallet, signature } = req.body;

    if (!wallet || !signature) {
      return res.status(400).json({ error: 'Wallet and signature required' });
    }

    const walletLower = wallet.toLowerCase();

    const result = await pool.query(
      'SELECT * FROM users WHERE wallet = $1',
      [walletLower]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Request nonce first.' });
    }

    const user = result.rows[0];

    if (!user.nonce) {
      return res.status(400).json({ error: 'No pending nonce. Request nonce first.' });
    }

    const recoveredAddress = ethers.verifyMessage(user.nonce, signature);
    
    if (recoveredAddress.toLowerCase() !== walletLower) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    await pool.query(
      'UPDATE users SET nonce = NULL, updated_at = CURRENT_TIMESTAMP WHERE wallet = $1',
      [walletLower]
    );

    const token = jwt.sign(
      { 
        wallet: walletLower, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        wallet: walletLower,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify signature' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT wallet, role, created_at FROM users WHERE wallet = $1',
      [req.user.wallet]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

module.exports = router;
