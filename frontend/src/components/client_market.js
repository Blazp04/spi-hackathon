import React, { useState } from 'react';
import './client_market.css';

const ClientMarket = ({ onViewDetails, onMintTokens, onTrading, onPortfolio, onMarket2 }) => {
  const [filters, setFilters] = useState({
    minting: true,
    building: true,
    trading: false,
    location: 'All Cities',
    propertyType: 'all',
    minInvestment: '',
    maxInvestment: ''
  });

  const [sortBy, setSortBy] = useState('newest');

  const projects = [
    {
      id: 1,
      name: 'Zagreb Tower A – Phase I',
      location: 'Zagreb, Croatia',
      status: 'Minting',
      progress: 42.7,
      raised: '€320,000',
      goal: '€750,000',
      tokenPrice: '€125',
      minInvestment: '€1,000',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'
    },
    {
      id: 2,
      name: 'Split Business Center',
      location: 'Split, Croatia',
      status: 'Building',
      progress: 78.3,
      raised: '€840,000',
      goal: '€1,200,000',
      tokenPrice: '€200',
      minInvestment: '€2,000',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'
    },
    {
      id: 3,
      name: 'Dubrovnik Sea View Residences',
      location: 'Dubrovnik, Croatia',
      status: 'Trading',
      progress: 100,
      raised: '€2,500,000',
      goal: '€2,500,000',
      currentPrice: '€520',
      volume24h: '€45,200',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400'
    },
    {
      id: 4,
      name: 'Rijeka Marina Complex',
      location: 'Rijeka, Croatia',
      status: 'Minting',
      progress: 35.2,
      raised: '€176,000',
      goal: '€500,000',
      tokenPrice: '€150',
      minInvestment: '€1,500',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400'
    }
  ];

  const filteredProjects = projects.filter(project => {
    if (filters.minting && project.status === 'Minting') return true;
    if (filters.building && project.status === 'Building') return true;
    if (filters.trading && project.status === 'Trading') return true;
    return false;
  });

  return (
    <div className="marketplace">
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
            <a href="#marketplace" className="nav-link active">Marketplace</a>
            <a href="#projects" onClick={(e) => { e.preventDefault(); onMarket2 && onMarket2(); }} className="nav-link">Projects</a>
            <a href="#portfolio" onClick={(e) => { e.preventDefault(); onPortfolio && onPortfolio(); }} className="nav-link">Portfolio</a>
            <a href="#mint-tokens" onClick={(e) => { e.preventDefault(); onMintTokens && onMintTokens(null); }} className="nav-link">Mint Tokens</a>
            <a href="#trading" onClick={(e) => { e.preventDefault(); onTrading && onTrading(null); }} className="nav-link">Trading</a>
          </nav>
          <div className="header-actions">
            <button className="connect-wallet-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Real Estate Marketplace</h1>
              <p className="page-subtitle">Discover premium real estate investment opportunities</p>
            </div>
          </div>

          <div className="content-wrapper">
            <aside className="sidebar">
              <div className="filter-section">
                <div className="filter-header">
                  <h3 className="filter-title">Filters</h3>
                </div>

                <div className="filter-group">
                  <h4 className="filter-group-title">Status</h4>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.minting}
                      onChange={(e) => setFilters({...filters, minting: e.target.checked})}
                    />
                    <span>Minting</span>
                    <span className="filter-count filter-count-blue">4</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.building}
                      onChange={(e) => setFilters({...filters, building: e.target.checked})}
                    />
                    <span>Building</span>
                    <span className="filter-count filter-count-orange">3</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.trading}
                      onChange={(e) => setFilters({...filters, trading: e.target.checked})}
                    />
                    <span>Trading</span>
                    <span className="filter-count filter-count-green">5</span>
                  </label>
                </div>

                <div className="filter-group">
                  <h4 className="filter-group-title">Location</h4>
                  <select 
                    className="filter-select"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  >
                    <option>All Cities</option>
                    <option>Zagreb</option>
                    <option>Split</option>
                    <option>Dubrovnik</option>
                    <option>Rijeka</option>
                  </select>
                </div>

                <div className="filter-group">
                  <h4 className="filter-group-title">Property Type</h4>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="propertyType"
                      checked={filters.propertyType === 'all'}
                      onChange={() => setFilters({...filters, propertyType: 'all'})}
                    />
                    <span>All Types</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="propertyType"
                      checked={filters.propertyType === 'residential'}
                      onChange={() => setFilters({...filters, propertyType: 'residential'})}
                    />
                    <span>Residential</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="propertyType"
                      checked={filters.propertyType === 'commercial'}
                      onChange={() => setFilters({...filters, propertyType: 'commercial'})}
                    />
                    <span>Commercial</span>
                  </label>
                </div>

                <div className="filter-group">
                  <h4 className="filter-group-title">Investment Range</h4>
                  <div className="range-inputs">
                    <input
                      type="text"
                      placeholder="Min €"
                      className="range-input"
                      value={filters.minInvestment}
                      onChange={(e) => setFilters({...filters, minInvestment: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Max €"
                      className="range-input"
                      value={filters.maxInvestment}
                      onChange={(e) => setFilters({...filters, maxInvestment: e.target.value})}
                    />
                  </div>
                </div>

                <button className="apply-filters-btn">Apply Filters</button>
              </div>
            </aside>

            <main className="projects-section">
              <div className="projects-header">
                <p className="projects-count">
                  <span className="count-number">{filteredProjects.length}</span> projects found
                </p>
                <div className="sort-controls">
                  <div className="sort-wrapper">
                    <span className="sort-label">Sort by</span>
                    <select 
                      className="sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest</option>
                      <option value="progress">Progress</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="projects-grid">
                {filteredProjects.map(project => (
                  <div key={project.id} className="project-card">
                    <div className="project-image">
                      <img src={project.image} alt={project.name} />
                      <span className={`status-badge ${project.status.toLowerCase()}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="project-content">
                      <h3 className="project-title">{project.name}</h3>
                      <p className="project-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {project.location}
                      </p>
                      
                      <div className="progress-section">
                        <div className="progress-header">
                          <span>Progress</span>
                          <span className="progress-percent">{project.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{width: `${project.progress}%`}}
                          ></div>
                        </div>
                        {project.status !== 'Trading' && (
                          <div className="progress-amounts">
                            <span>{project.raised} raised</span>
                            <span>{project.goal} goal</span>
                          </div>
                        )}
                      </div>

                      <div className="project-details">
                        {project.status === 'Trading' ? (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Current Price</span>
                              <span className="detail-value">{project.currentPrice}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">24h Volume</span>
                              <span className="detail-value success">{project.volume24h}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Token Price</span>
                              <span className="detail-value">{project.tokenPrice}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Min. Investment</span>
                              <span className="detail-value">{project.minInvestment}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <button 
                        className={`action-btn ${project.status === 'Trading' ? 'trade' : 'invest'}`}
                        onClick={() => onViewDetails && onViewDetails(project)}
                      >
                        {project.status === 'Trading' ? 'Trade Now' : 'View Details'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientMarket;
