import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import './client_market.css';

const ClientMarket = ({ onViewDetails, onMintTokens, onTrading, onPortfolio, onAdmin, onSubmitProject }) => {
  const { user, isAuthenticated, isAdmin, loading: authLoading, connectWallet, disconnect, hasMetaMask, error: authError } = useAuth();
  
  const [filters, setFilters] = useState({
    approved: true,
    minting: true,
    building: true,
    trading: true,
    finished: true,
    pending: false,
    location: 'All Cities',
    propertyType: 'all',
    minInvestment: '',
    maxInvestment: ''
  });

  const [sortBy, setSortBy] = useState('newest');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await projectsAPI.getAll();
        console.log('API Response:', data);
        console.log('Projects:', data.projects);
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([
          {
            id: 1,
            name: 'Zagreb Tower A – Phase I',
            location: 'Zagreb, Croatia',
            status: 'approved',
            goal: 750000,
            token_price: 125,
            min_investment: 1000,
            images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400']
          },
          {
            id: 2,
            name: 'Split Business Center',
            location: 'Split, Croatia',
            status: 'approved',
            goal: 1200000,
            token_price: 200,
            min_investment: 2000,
            images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [isAdmin, filters.pending]);

  console.log('All projects:', projects);
  console.log('Filters:', filters);
  
  const filteredProjects = projects.filter(project => {
    console.log('Checking project:', project.name, 'status:', project.status);
    if (filters.approved && project.status === 'approved') return true;
    if (filters.minting && project.status === 'minting') return true;
    if (filters.building && project.status === 'building') return true;
    if (filters.trading && project.status === 'trading') return true;
    if (filters.finished && project.status === 'finished') return true;
    if (filters.pending && project.status === 'pending' && isAdmin) return true;
    return false;
  });
  
  console.log('Filtered projects:', filteredProjects);

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `€${Number(price).toLocaleString()}`;
  };

  const getProjectImage = (project) => {
    if (project.images && project.images.length > 0) {
      return project.images[0];
    }
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  };

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
            {isAuthenticated && (
              <a href="#submit" onClick={(e) => { e.preventDefault(); onSubmitProject && onSubmitProject(); }} className="nav-link">Submit Property</a>
            )}
            <a href="#mint-tokens" onClick={(e) => { e.preventDefault(); onMintTokens && onMintTokens(); }} className="nav-link">Mint Tokens</a>
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
                      checked={filters.approved}
                      onChange={(e) => setFilters({...filters, approved: e.target.checked})}
                    />
                    <span>Approved</span>
                    <span className="filter-count filter-count-green">{projects.filter(p => p.status === 'approved').length}</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.minting}
                      onChange={(e) => setFilters({...filters, minting: e.target.checked})}
                    />
                    <span>Minting</span>
                    <span className="filter-count filter-count-blue">{projects.filter(p => p.status === 'minting').length}</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.building}
                      onChange={(e) => setFilters({...filters, building: e.target.checked})}
                    />
                    <span>Building</span>
                    <span className="filter-count filter-count-orange">{projects.filter(p => p.status === 'building').length}</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.trading}
                      onChange={(e) => setFilters({...filters, trading: e.target.checked})}
                    />
                    <span>Trading</span>
                    <span className="filter-count filter-count-purple">{projects.filter(p => p.status === 'trading').length}</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.finished}
                      onChange={(e) => setFilters({...filters, finished: e.target.checked})}
                    />
                    <span>Finished</span>
                    <span className="filter-count filter-count-gray">{projects.filter(p => p.status === 'finished').length}</span>
                  </label>
                  {isAdmin && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.pending}
                        onChange={(e) => setFilters({...filters, pending: e.target.checked})}
                      />
                      <span>Pending</span>
                      <span className="filter-count filter-count-yellow">{projects.filter(p => p.status === 'pending').length}</span>
                    </label>
                  )}
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
                {loading ? (
                  <div className="loading-message">Loading projects...</div>
                ) : filteredProjects.length === 0 ? (
                  <div className="empty-message">No projects found. {!isAuthenticated && 'Connect wallet to submit a property.'}</div>
                ) : (
                  filteredProjects.map((project, index) => {
                    console.table(project);
                    const progressPercentage = project.status === 'finished' ? 100 : (index === 0 ? 43 : 60);
                    const progressColor = project.status === 'finished' ? '#10b981' : '#3b82f6';
                    return (
                      <div key={project.id} className="project-card1">
                        <div className="project-image">
                          <img src={getProjectImage(project)} alt={project.name} />
                          <span className={`status-badge ${project.status}`}>
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
                            {project.location || 'Location TBD'}
                          </p>
                          
                          <div className="project-details">
                            <div className="detail-item">
                              <span className="detail-label">Goal</span>
                              <span className="detail-value">{formatPrice(project.goal)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Min. Investment</span>
                              <span className="detail-value">{formatPrice(project.min_investment)}</span>
                            </div>
                          </div>

                          <div style={{marginTop: '16px', marginBottom: '16px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                              <span style={{fontSize: '13px', color: '#64748b'}}>Progress</span>
                              <span style={{fontSize: '14px', fontWeight: '600', color: project.status === 'finished' ? '#10b981' : '#1e293b'}}>{progressPercentage}%</span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '8px',
                              background: '#e2e8f0',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${progressPercentage}%`,
                                height: '100%',
                                background: progressColor,
                                borderRadius: '4px'
                              }}></div>
                            </div>
                          </div>

                          <button 
                            className="action-btn invest"
                            onClick={() => onViewDetails && onViewDetails(project)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientMarket;
