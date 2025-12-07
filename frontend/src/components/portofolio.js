import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './client_market.css';
import './portofolio.css';

const Portfolio = ({ onMarketplace, onMintTokens, onTrading, onAdmin, onSubmitProject }) => {
  const { user, isAuthenticated, isAdmin, loading: authLoading, connectWallet, disconnect, hasMetaMask, error: authError } = useAuth();

  // Mock data za korisnička ulaganja (u budućnosti dohvatiti iz API-ja)
  const userInvestments = [
    {
      id: 1,
      projectName: 'Zagreb Tower A – Phase I',
      location: 'Zagreb, Croatia',
      tokensOwned: 40,
      tokenPrice: 125,
      totalValue: 5000,
      initialInvestment: 4500,
      profitLoss: 500,
      profitLossPercent: 11.11,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'
    },
    {
      id: 2,
      projectName: 'Split Waterfront Residences',
      location: 'Split, Croatia',
      tokensOwned: 25,
      tokenPrice: 150,
      totalValue: 3750,
      initialInvestment: 3500,
      profitLoss: 250,
      profitLossPercent: 7.14,
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'
    },
    {
      id: 3,
      projectName: 'Dubrovnik Heritage Plaza',
      location: 'Dubrovnik, Croatia',
      tokensOwned: 15,
      tokenPrice: 200,
      totalValue: 3000,
      initialInvestment: 3200,
      profitLoss: -200,
      profitLossPercent: -6.25,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
    }
  ];

  const totalPortfolioValue = userInvestments.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalInvestment = userInvestments.reduce((sum, inv) => sum + inv.initialInvestment, 0);
  const totalProfitLoss = totalPortfolioValue - totalInvestment;
  const totalProfitLossPercent = ((totalProfitLoss / totalInvestment) * 100).toFixed(2);

  const portfolioStats = [
    {
      icon: '💼',
      color: '#3B82F6',
      label: 'Total Portfolio Value',
      value: '€2,847,500',
      change: '+12.5%',
      changePositive: true
    },
    {
      icon: '💰',
      color: '#F59E0B',
      label: 'Total Returns',
      value: '€347,500',
      change: '+8.7%',
      changePositive: true
    },
    {
      icon: '🏢',
      color: '#8B5CF6',
      label: 'Total Tokens Owned',
      value: '47,850',
      change: '',
      changePositive: null
    },
    {
      icon: '📊',
      color: '#EF4444',
      label: 'Active Projects',
      value: '12',
      change: '',
      changePositive: null
    }
  ];

  return (
    <div className="portfolio-container">
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
            <a href="#trading" onClick={(e) => { e.preventDefault(); onTrading && onTrading(); }} className="nav-link">Trading</a>
            <a href="#portfolio" className="nav-link active">Portfolio</a>
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

      <div className="portfolio-content">
        <div className="portfolio-title-section">
          <div>
            <h1 className="portfolio-title">My Portfolio</h1>
            <p className="portfolio-subtitle">Track your real estate investments and performance</p>
          </div>
          <div className="title-actions">

          </div>
        </div>

        <div className="stats-grid">
          {portfolioStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              </div>
              <div className="stat-content">
                <div className="stat-header">
                  <span className="stat-label">{stat.label}</span>
                  {stat.change && (
                    <span className={`stat-change ${stat.changePositive ? 'positive' : 'negative'}`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="holdings-section">
          <div className="holdings-header">
            <h2 className="holdings-title">My Property Holdings</h2>
            <p className="holdings-subtitle">
              Total: {userInvestments.length} properties • Value: €{totalPortfolioValue.toLocaleString()}
            </p>
          </div>

          <div className="holdings-grid">
            {userInvestments.map((investment) => (
              <div key={investment.id} className="holding-card">
                <div className="holding-image">
                  <img src={investment.image} alt={investment.projectName} />
                  <div className="holding-tokens-badge">
                    {investment.tokensOwned} tokens
                  </div>
                </div>
                <div className="holding-content">
                  <h3 className="holding-name">{investment.projectName}</h3>
                  <p className="holding-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {investment.location}
                  </p>

                  <div className="holding-stats">
                    <div className="holding-stat">
                      <span className="stat-label">Tokens Owned</span>
                      <span className="stat-value">{investment.tokensOwned}</span>
                    </div>
                    <div className="holding-stat">
                      <span className="stat-label">Token Price</span>
                      <span className="stat-value">€{investment.tokenPrice}</span>
                    </div>
                    <div className="holding-stat">
                      <span className="stat-label">Current Value</span>
                      <span className="stat-value">€{investment.totalValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="holding-performance">
                    <div className="performance-bar">
                      <div className="performance-label">
                        <span>Investment</span>
                        <span>€{investment.initialInvestment.toLocaleString()}</span>
                      </div>
                      <div className="performance-indicator">
                        <span className={`performance-change ${investment.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                          {investment.profitLoss >= 0 ? '+' : ''}€{investment.profitLoss.toLocaleString()} 
                          ({investment.profitLoss >= 0 ? '+' : ''}{investment.profitLossPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="holding-action-btn" onClick={() => onTrading && onTrading()}>
                    Trade Tokens
                  </button>
                </div>
              </div>
            ))}
          </div>

          {userInvestments.length === 0 && (
            <div className="empty-holdings">
              <div className="empty-icon">📊</div>
              <h3>No Holdings Yet</h3>
              <p>Start investing in tokenized properties to see your portfolio here</p>
              <button className="browse-btn" onClick={() => onMarketplace && onMarketplace()}>
                Browse Properties
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
