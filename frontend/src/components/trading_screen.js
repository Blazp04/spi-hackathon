import React, { useState } from 'react';
import './trading_screen.css';

const TradingScreen = ({ project, onBack, onMarket2, onPortfolio, onMintTokens }) => {
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('1000');
  const [receiveAmount, setReceiveAmount] = useState('40.81');

  const projectData = project || {
    name: 'Zagreb Tower A – Phase I',
    symbol: 'ZTA1',
    pair: 'ZTA1 / USDT',
    currentPrice: '€24.50',
    priceChange: '+2.4%',
    priceChangePositive: true
  };

  const transactions = [
    {
      type: 'buy',
      amount: '+15.2 ZTA1',
      price: '€372.40',
      time: '2 minutes ago'
    },
    {
      type: 'sell',
      amount: '-8.5 ZTA1',
      price: '€208.25',
      time: '1 hour ago'
    }
  ];

  return (
    <div className="trading-screen">
      <div className="trading-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <span className="logo-text">RealtyChain</span>
            </div>
            <nav className="nav">
              <a href="#marketplace" onClick={(e) => { e.preventDefault(); onBack && onBack(); }} className="nav-link">Marketplace</a>
              <a href="#trading" className="nav-link active">Trading</a>
              <a href="#portfolio" onClick={(e) => { e.preventDefault(); onPortfolio && onPortfolio(); }} className="nav-link">Portfolio</a>
              <a href="#mint-tokens" onClick={(e) => { e.preventDefault(); onMintTokens && onMintTokens(); }} className="nav-link">Mint Tokens</a>
            </nav>
            <div className="header-actions">
              <button className="connect-wallet-btn">Connect Wallet</button>
              <button className="profile-btn">
                <div className="profile-avatar"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="trading-content">
        <div className="container">
          <div className="trading-layout">
            <div className="trading-panel">
              <div className="asset-header">
                <div className="asset-icon">🏢</div>
                <div className="asset-info">
                  <h2 className="asset-name">{projectData.name}</h2>
                  <div className="asset-pair">{projectData.pair}</div>
                </div>
              </div>

              <div className="price-display">
                <div className="current-price">{projectData.currentPrice}</div>
                <div className={`price-change ${projectData.priceChangePositive ? 'positive' : 'negative'}`}>
                  {projectData.priceChange}
                </div>
              </div>

              <div className="trade-tabs">
                <button 
                  className={`trade-tab ${activeTab === 'buy' ? 'active' : ''}`}
                  onClick={() => setActiveTab('buy')}
                >
                  Buy
                </button>
                <button 
                  className={`trade-tab ${activeTab === 'sell' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sell')}
                >
                  Sell
                </button>
              </div>

              <div className="trade-form">
                <div className="form-section">
                  <label className="form-label">You Pay</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="trade-input"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="currency-selector">
                      <span className="currency-label">USDT</span>
                      <span className="currency-icon">🟢</span>
                    </div>
                  </div>
                  <div className="balance-info">Balance: 1,240.00 USDT</div>
                </div>

                <div className="swap-icon-container">
                  <button className="swap-icon-btn">⇅</button>
                </div>

                <div className="form-section">
                  <label className="form-label">You Receive</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="trade-input"
                      value={receiveAmount}
                      onChange={(e) => setReceiveAmount(e.target.value)}
                    />
                    <div className="currency-selector">
                      <span className="currency-label">ZTA1</span>
                      <span className="currency-icon">🔵</span>
                    </div>
                  </div>
                </div>

                <div className="trade-details">
                  <div className="detail-row">
                    <span className="detail-label">Rate</span>
                    <span className="detail-value">1 ZTA1 = €24.50</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Price Impact</span>
                    <span className="detail-value success">0.15%</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Slippage Tolerance</span>
                    <span className="detail-value">0.5%</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Network Fee</span>
                    <span className="detail-value">~€2.40</span>
                  </div>
                </div>

                <button className="swap-button">Swap</button>
              </div>

              <div className="recent-transactions">
                <h3 className="section-title">Recent Transactions</h3>
                <div className="transactions-list">
                  {transactions.map((tx, index) => (
                    <div key={index} className="transaction-item">
                      <div className="transaction-icon-wrapper">
                        <div className={`transaction-icon ${tx.type}`}>
                          {tx.type === 'buy' ? '↑' : '↓'}
                        </div>
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-type">
                          {tx.type === 'buy' ? 'Buy' : 'Sell'} ZTA1
                        </div>
                        <div className="transaction-time">{tx.time}</div>
                      </div>
                      <div className="transaction-amounts">
                        <div className={`transaction-amount ${tx.type}`}>{tx.amount}</div>
                        <div className="transaction-price">{tx.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="market-info-panel">
              <div className="info-card">
                <h3 className="card-title">Liquidity Pool</h3>
                <div className="liquidity-stats">
                  <div className="stat-row">
                    <span className="stat-label">Total Liquidity</span>
                    <span className="stat-value">€360,000</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">USDT Reserve</span>
                    <span className="stat-value">180,000 USDT</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">ZTA1 Reserve</span>
                    <span className="stat-value">7,347 ZTA1</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">24h Volume</span>
                    <span className="stat-value success">€42,580</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3 className="card-title">Market Statistics</h3>
                <div className="market-stats">
                  <div className="stat-row">
                    <span className="stat-label">Market Cap</span>
                    <span className="stat-value">€1.85M</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Circulating Supply</span>
                    <span className="stat-value">75,510 ZTA1</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Total Supply</span>
                    <span className="stat-value">100,000 ZTA1</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">APY</span>
                    <span className="stat-value success">8.4%</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3 className="card-title">Price History (7D)</h3>
                <div className="chart-placeholder">
                  <svg width="100%" height="150" viewBox="0 0 300 150">
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      points="0,100 50,80 100,90 150,60 200,70 250,40 300,50"
                    />
                    <polyline
                      fill="url(#gradient)"
                      stroke="none"
                      points="0,100 50,80 100,90 150,60 200,70 250,40 300,50 300,150 0,150"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="chart-loading">Chart Loading...</div>
                </div>
              </div>

              <div className="info-card">
                <h3 className="card-title">Quick Actions</h3>
                <div className="quick-actions">
                  <button className="action-link">
                    <span className="action-icon">+</span>
                    <span className="action-text">Add Liquidity</span>
                  </button>
                  <button className="action-link">
                    <span className="action-icon">📊</span>
                    <span className="action-text">View Analytics</span>
                  </button>
                  <button className="action-link">
                    <span className="action-icon">📄</span>
                    <span className="action-text">View Contract</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingScreen;
