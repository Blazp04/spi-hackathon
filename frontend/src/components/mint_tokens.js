import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import './mint_tokens.css';

const MintTokens = ({ project, onBack, onMarket2, onPortfolio, onTrading, onAdmin, onSubmitProject }) => {
  const { user, isAuthenticated, isAdmin, loading: authLoading, connectWallet, disconnect, hasMetaMask, error: authError } = useAuth();
  const [investmentAmount, setInvestmentAmount] = useState('1,000');
  const [tokensToReceive, setTokensToReceive] = useState(0);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(project?.id || null);
  const [loading, setLoading] = useState(true);

  // Hardcoded projects data
  useEffect(() => {
    const hardcodedProjects = [
      {
        id: 1,
        name: 'Zagreb Tower A – Phase I',
        location: 'Zagreb, Croatia',
        status: 'Minting',
        goal: 750000,
        current_funding: 320000,
        token_price: 125,
        min_investment: 1000,
        images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800']
      },
      {
        id: 2,
        name: 'Split Waterfront Residences',
        location: 'Split, Croatia',
        status: 'Minting',
        goal: 1200000,
        current_funding: 450000,
        token_price: 150,
        min_investment: 2000,
        images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800']
      },
      {
        id: 3,
        name: 'Dubrovnik Heritage Plaza',
        location: 'Dubrovnik, Croatia',
        status: 'Minting',
        goal: 950000,
        current_funding: 380000,
        token_price: 200,
        min_investment: 1500,
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800']
      }
    ];
    
    setProjects(hardcodedProjects);
    if (!selectedProjectId) {
      setSelectedProjectId(hardcodedProjects[0].id);
    }
    setLoading(false);
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const calculateTokens = (amount) => {
    if (!selectedProject) return 0;
    const numAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    return Math.floor(numAmount / selectedProject.token_price);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setInvestmentAmount(value);
    setTokensToReceive(calculateTokens(value));
  };

  return (
    <div className="mint-tokens">
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
            <a href="#marketplace" onClick={(e) => { e.preventDefault(); onBack && onBack(); }} className="nav-link">Marketplace</a>
            {isAuthenticated && (
              <a href="#submit" onClick={(e) => { e.preventDefault(); onSubmitProject && onSubmitProject(); }} className="nav-link">Submit Property</a>
            )}
            <a href="#mint-tokens" className="nav-link active">Mint Tokens</a>
            <a href="#trading" onClick={(e) => { e.preventDefault(); onTrading && onTrading(); }} className="nav-link">Trading</a>
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
          <h2 className="selector-title">Select Project to Mint Tokens</h2>
          {loading ? (
            <div className="loading-state">
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects available for minting.</p>
            </div>
          ) : (
            <div className="project-selector">
              {projects.map((proj) => (
                <div 
                  key={proj.id}
                  className={`project-option ${selectedProjectId === proj.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProjectId(proj.id)}
                >
                  <div className="project-option-image">
                    <img src={proj.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'} alt={proj.name} />
                  </div>
                  <div className="project-option-info">
                    <h3>{proj.name}</h3>
                    <p>{proj.location}</p>
                    <span className="project-option-price">Token: €{proj.token_price}</span>
                  </div>
                  {selectedProjectId === proj.id && (
                    <div className="selected-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <div className="mint-content">
          <div className="container">
            <div className="content-layout">
              <div className="left-column">
                <div className="project-preview-card">
                  <div className="project-preview-image">
                    <img src={selectedProject.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'} alt={selectedProject.name} />
                    <span className="status-badge-preview">{selectedProject.status}</span>
                  </div>
                  <div className="location-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="10" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{selectedProject.location}</span>
                  </div>
                  <h2 className="project-preview-name">{selectedProject.name}</h2>
                  
                  <div className="budget-info">
                    <div className="budget-item">
                      <span className="budget-label">Total Budget</span>
                      <span className="budget-value">€{selectedProject.goal?.toLocaleString()}</span>
                    </div>
                    <div className="budget-item">
                      <span className="budget-label">Currently Raised</span>
                      <span className="budget-value raised">€{selectedProject.current_funding?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="progress-info">
                    <div className="progress-label-row">
                      <span className="progress-percentage">{((selectedProject.current_funding / selectedProject.goal) * 100).toFixed(1)}% Complete</span>
                      <span className="progress-remaining">€{(selectedProject.goal - selectedProject.current_funding).toLocaleString()} remaining</span>
                    </div>
                    <div className="progress-bar-preview">
                      <div 
                        className="progress-fill-preview" 
                        style={{width: `${((selectedProject.current_funding / selectedProject.goal) * 100).toFixed(1)}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

            <div className="right-column">
              <div className="alert-warning">
                <div className="alert-icon">⚠</div>
                <div className="alert-content">
                  <div className="alert-title">Minting period ends on March 15, 2024</div>
                  <div className="alert-text">Limited time to participate in this investment opportunity</div>
                </div>
              </div>

              <div className="mint-card">
                <h2 className="mint-title">Mint Property Tokens</h2>

                <div className="token-stats">
                  <div className="token-stat">
                    <div className="token-stat-value">€{selectedProject.token_price}</div>
                    <div className="token-stat-label">Current Token Price</div>
                  </div>
                  <div className="token-stat">
                    <div className="token-stat-value">{(selectedProject.goal / selectedProject.token_price).toLocaleString()}</div>
                    <div className="token-stat-label">Total Token Supply</div>
                  </div>
                  <div className="token-stat">
                    <div className="token-stat-value success">{Math.floor(selectedProject.current_funding / selectedProject.token_price).toLocaleString()}</div>
                    <div className="token-stat-label">Tokens Minted</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Investment Amount (€)</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      value={investmentAmount}
                      onChange={handleAmountChange}
                      placeholder="1,000"
                    />
                    <span className="input-currency">EUR</span>
                  </div>
                  <div className="form-hint">Minimum investment: €100</div>
                </div>

                <div className="receive-section">
                  <div className="receive-label">You will receive:</div>
                  <div className="receive-value">{tokensToReceive.toLocaleString()} TOKENS</div>
                </div>

                <div className="transaction-details">
                  <h3 className="transaction-title">Transaction Details</h3>
                  <div className="transaction-list">
                    <div className="transaction-row">
                      <span className="transaction-label">Token Price</span>
                      <span className="transaction-value">€{selectedProject.token_price.toFixed(2)}</span>
                    </div>
                    <div className="transaction-row">
                      <span className="transaction-label">Platform Fee (2%)</span>
                      <span className="transaction-value">€{(tokensToReceive * selectedProject.token_price * 0.02).toFixed(2)}</span>
                    </div>
                    <div className="transaction-row">
                      <span className="transaction-label">Gas Fee (Est.)</span>
                      <span className="transaction-value">€3.50</span>
                    </div>
                    <div className="transaction-row total">
                      <span className="transaction-label">Total Cost</span>
                      <span className="transaction-value">€{((tokensToReceive * selectedProject.token_price) + (tokensToReceive * selectedProject.token_price * 0.02) + 3.50).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn-secondary" onClick={onBack}>Cancel</button>
                  <button className="btn-primary">Confirm Investment</button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MintTokens;
