import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import './client_market.css';
import './trading_screen.css';

const TradingScreen = ({ project, onMarketplace, onPortfolio, onMintTokens, onAdmin, onSubmitProject }) => {
  const { user, isAuthenticated, isAdmin, loading: authLoading, connectWallet, disconnect, hasMetaMask, error: authError } = useAuth();
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('1000');
  const [receiveAmount, setReceiveAmount] = useState('40.81');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsAPI.getApproved();
        setProjects(data.length > 0 ? data : [
          {
            id: 1,
            name: 'Zagreb Tower A – Phase I',
            location: 'Zagreb, Croatia',
            token_price: 125,
            symbol: 'ZTA1'
          },
          {
            id: 2,
            name: 'Split Waterfront Residences',
            location: 'Split, Croatia',
            token_price: 150,
            symbol: 'SWR1'
          }
        ]);
        if (!selectedProjectId && (data.length > 0 || true)) {
          setSelectedProjectId(data.length > 0 ? data[0].id : 1);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([
          {
            id: 1,
            name: 'Zagreb Tower A – Phase I',
            location: 'Zagreb, Croatia',
            token_price: 125,
            symbol: 'ZTA1'
          },
          {
            id: 2,
            name: 'Split Waterfront Residences',
            location: 'Split, Croatia',
            token_price: 150,
            symbol: 'SWR1'
          }
        ]);
        setSelectedProjectId(1);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const projectData = selectedProject ? {
    name: selectedProject.name,
    symbol: selectedProject.symbol || 'TOKEN',
    pair: `${selectedProject.symbol || 'TOKEN'} / USDT`,
    currentPrice: `€${selectedProject.token_price || 0}`,
    priceChange: '+2.4%',
    priceChangePositive: true
  } : {
    name: 'Select a project',
    symbol: 'N/A',
    pair: 'N/A / USDT',
    currentPrice: '€0',
    priceChange: '0%',
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
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">BlockByBlock</span>
          </div>
          <nav className="nav">
            <a href="#marketplace" onClick={(e) => { e.preventDefault(); onMarketplace && onMarketplace(); }} className="nav-link">Marketplace</a>
            {isAuthenticated && (
              <a href="#submit" onClick={(e) => { e.preventDefault(); onSubmitProject && onSubmitProject(); }} className="nav-link">Submit Property</a>
            )}
            <a href="#mint-tokens" onClick={(e) => { e.preventDefault(); onMintTokens && onMintTokens(); }} className="nav-link">Mint Tokens</a>
            <a href="#trading" className="nav-link active">Trading</a>
            <a href="#portfolio" onClick={(e) => { e.preventDefault(); onPortfolio && onPortfolio(); }} className="nav-link">Portfolio</a>
            {isAdmin && (
              <a href="#admin" onClick={(e) => { e.preventDefault(); onAdmin && onAdmin(); }} className="nav-link admin-link">Admin Dashboard</a>
            )}
          </nav>
          <div className="header-actions">
            {authError && <span className="auth-error">{authError}</span>}
            {isAuthenticated ? (
              <div className="user-menu">
                {isAdmin && <span className="admin-badge">ADMIN</span>}
                <span className="wallet-display">
                  {user?.wallet?.slice(0, 6)}...{user?.wallet?.slice(-4)}
                </span>
                <button className="disconnect-btn" onClick={disconnect}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                className="connect-wallet-btn" 
                onClick={connectWallet}
                disabled={authLoading || !hasMetaMask}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                {authLoading ? 'Connecting...' : hasMetaMask ? 'Connect Wallet' : 'Install MetaMask'}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="project-selector-section">
        <div className="container">
          <div className="selector-header">
            <h3>Select Property to Trade</h3>
            <p>Choose a tokenized property to start trading</p>
          </div>
          <div className="project-selector-grid">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className={`selector-card ${selectedProjectId === proj.id ? 'selected' : ''}`}
                onClick={() => setSelectedProjectId(proj.id)}
              >
                <div className="selector-card-content">
                  <div className="selector-icon">🏢</div>
                  <div className="selector-info">
                    <h4>{proj.name}</h4>
                    <p>{proj.location}</p>
                    <div className="selector-price">€{proj.token_price} / token</div>
                  </div>
                </div>
                {selectedProjectId === proj.id && (
                  <div className="selected-checkmark">✓</div>
                )}
              </div>
            ))}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingScreen;
