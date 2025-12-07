import React, { useState } from 'react';
import './portofolio.css';

const Portfolio = ({ onBack, onMintTokens, onTrading }) => {
  const [timeRange, setTimeRange] = useState('1Y');

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

  const chartData = [
    { month: 'Jan', value: 2.1 },
    { month: 'Feb', value: 2.15 },
    { month: 'Mar', value: 2.25 },
    { month: 'Apr', value: 2.4 },
    { month: 'May', value: 2.45 },
    { month: 'Jun', value: 2.5 },
    { month: 'Jul', value: 2.55 },
    { month: 'Aug', value: 2.6 },
    { month: 'Sep', value: 2.7 },
    { month: 'Oct', value: 2.75 },
    { month: 'Nov', value: 2.8 },
    { month: 'Dec', value: 2.85 }
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));

  return (
    <div className="portfolio-container">
      <header className="portfolio-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">R</div>
            <span className="logo-text">RealtyChain</span>
          </div>
          <nav className="nav-links">
            <button onClick={onBack} className="nav-link">Marketplace</button>
            <button onClick={onMintTokens} className="nav-link">Mint Tokens</button>
            <button className="nav-link active">Portfolio</button>
            <button onClick={onTrading} className="nav-link">Trading</button>
          </nav>
          <div className="header-actions">
            <button className="connect-btn">
              <span className="status-dot"></span>
              Connected
            </button>
            <div className="user-avatar">
              <img src="https://ui-avatars.com/api/?name=User&size=32&background=3b82f6&color=fff" alt="User" />
            </div>
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
            <button className="export-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.66666 6.66667L7.99999 10L11.3333 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export Report
            </button>
            <button className="new-investment-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3.33334V12.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.33334 8H12.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              New Investment
            </button>
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

        <div className="performance-section">
          <div className="performance-header">
            <h2 className="performance-title">Portfolio Performance</h2>
            <div className="time-range-buttons">
              {['1W', '6M', '3M', '1M'].map((range) => (
                <button
                  key={range}
                  className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <svg width="100%" height="300" className="chart-svg">
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={60 + i * 60}
                  x2="100%"
                  y2={60 + i * 60}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}

              {[2.5, 2, 1.5, 1, 0.5].map((value, i) => (
                <text
                  key={i}
                  x="10"
                  y={60 + i * 60}
                  fill="#6B7280"
                  fontSize="12"
                  alignmentBaseline="middle"
                >
                  {value}M
                </text>
              ))}

              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                points={chartData.map((d, i) => {
                  const x = 80 + (i * (100 / (chartData.length - 1)) * 0.85) + '%';
                  const y = 300 - ((d.value - minValue) / (maxValue - minValue)) * 240;
                  return `${x},${y}`;
                }).join(' ')}
              />

              <polygon
                fill="url(#gradient)"
                opacity="0.2"
                points={
                  chartData.map((d, i) => {
                    const x = 80 + (i * (100 / (chartData.length - 1)) * 0.85);
                    const y = 300 - ((d.value - minValue) / (maxValue - minValue)) * 240;
                    return `${x}%,${y}`;
                  }).join(' ') + ` 95%,300 5%,300`
                }
              />

              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
                </linearGradient>
              </defs>

              {chartData.map((d, i) => (
                <text
                  key={i}
                  x={`${80 + (i * (100 / (chartData.length - 1)) * 0.85)}%`}
                  y="290"
                  fill="#6B7280"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {d.month}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
