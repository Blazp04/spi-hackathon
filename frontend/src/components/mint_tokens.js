import React, { useState } from 'react';
import './mint_tokens.css';

const MintTokens = ({ project, onBack, onMarket2, onPortfolio, onTrading }) => {
  const [investmentAmount, setInvestmentAmount] = useState('1,000');
  const [tokensToReceive, setTokensToReceive] = useState(0);

  const projectData = project || {
    name: 'Zagreb Tower A – Phase I',
    location: 'Zagreb, Croatia',
    status: 'Minting',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    totalBudget: '€750,000',
    currentlyRaised: '€320,000',
    percentage: 42.7,
    remaining: '€430,000',
    tokenPrice: '€1.00',
    totalTokenSupply: 750000,
    tokensMinted: 320000,
    minInvestment: '€100',
    daysRemaining: 12
  };

  const calculateTokens = (amount) => {
    const numAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    const tokenPrice = parseFloat(projectData.tokenPrice.replace(/[^0-9.-]+/g, ''));
    return Math.floor(numAmount / tokenPrice);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setInvestmentAmount(value);
    setTokensToReceive(calculateTokens(value));
  };

  const tokenPrice = parseFloat(projectData.tokenPrice.replace(/[^0-9.-]+/g, ''));
  const platformFee = tokensToReceive * tokenPrice * 0.02; // 2%
  const gasFee = 3.50;
  const totalCost = (tokensToReceive * tokenPrice) + platformFee + gasFee;

  return (
    <div className="mint-tokens">
      <div className="mint-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">PC</span>
              <span className="logo-text">PropChain</span>
            </div>
            <nav className="nav">
              <a href="#marketplace" onClick={(e) => { e.preventDefault(); onBack && onBack(); }} className="nav-link">Marketplace</a>
              <a href="#portfolio" onClick={(e) => { e.preventDefault(); onPortfolio && onPortfolio(); }} className="nav-link">Portfolio</a>
              <a href="#mint-tokens" className="nav-link active">Mint Tokens</a>
              <a href="#trading" onClick={(e) => { e.preventDefault(); onTrading && onTrading(); }} className="nav-link">Trading</a>
            </nav>
            <button className="connect-wallet-btn">Connect Wallet</button>
          </div>
        </div>
      </div>

      <div className="breadcrumb-section">
        <div className="container">
          <div className="breadcrumb">
            <span onClick={onBack} className="breadcrumb-link">Marketplace</span>
            <span className="breadcrumb-separator">/</span>
            <span onClick={onBack} className="breadcrumb-link">{projectData.name}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Mint Tokens</span>
          </div>
        </div>
      </div>

      <div className="mint-content">
        <div className="container">
          <div className="content-layout">
            <div className="project-info-section">
              <div className="project-card">
                <div className="project-image">
                  <img src={projectData.image} alt={projectData.name} />
                  <span className="status-badge">{projectData.status}</span>
                </div>
                <div className="project-details">
                  <h2 className="project-name">{projectData.name}</h2>
                  <div className="project-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Budget</span>
                      <span className="stat-value">{projectData.totalBudget}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Currently Raised</span>
                      <span className="stat-value">{projectData.currentlyRaised}</span>
                    </div>
                  </div>
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>{projectData.percentage}% Complete</span>
                      <span>{projectData.remaining} remaining</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${projectData.percentage}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mint-form-section">
              <div className="alert-warning">
                <div className="alert-icon">⚠</div>
                <div className="alert-content">
                  <div className="alert-title">Minting period ends on March 15, 2024</div>
                  <div className="alert-text">Only {projectData.daysRemaining} days remaining to participate in this investment opportunity</div>
                </div>
              </div>

              <div className="mint-card">
                <h2 className="mint-title">Mint Property Tokens</h2>

                <div className="token-stats">
                  <div className="token-stat">
                    <div className="token-stat-value">{projectData.tokenPrice}</div>
                    <div className="token-stat-label">Current Token Price</div>
                  </div>
                  <div className="token-stat">
                    <div className="token-stat-value">{projectData.totalTokenSupply.toLocaleString()}</div>
                    <div className="token-stat-label">Total Token Supply</div>
                  </div>
                  <div className="token-stat">
                    <div className="token-stat-value success">{projectData.tokensMinted.toLocaleString()}</div>
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
                  <div className="form-hint">Minimum investment: {projectData.minInvestment}</div>
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
                      <span className="transaction-value">€{tokenPrice.toFixed(2)}</span>
                    </div>
                    <div className="transaction-row">
                      <span className="transaction-label">Platform Fee (2%)</span>
                      <span className="transaction-value">€{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="transaction-row">
                      <span className="transaction-label">Gas Fee (Est.)</span>
                      <span className="transaction-value">€{gasFee.toFixed(2)}</span>
                    </div>
                    <div className="transaction-row total">
                      <span className="transaction-label">Total Cost</span>
                      <span className="transaction-value">€{totalCost.toFixed(2)}</span>
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
    </div>
  );
};

export default MintTokens;
