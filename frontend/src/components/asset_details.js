import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './asset_details.css';

const AssetDetails = ({ project, onBack, onMintTokens, onTrading, onMarket2, onPortfolio, onAdmin, onSubmitProject }) => {
  const { user, isAuthenticated, isAdmin, loading: authLoading, connectWallet, disconnect, hasMetaMask, error: authError } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const projectData = project || {
    name: 'Zagreb Tower A – Phase I',
    description: 'Premium residential development in the heart of Zagreb business district. 120 luxury apartments with modern amenities.',
    location: 'Zagreb, Croatia',
    status: 'Minting',
    raised: '€280,000',
    goal: '€320,000',
    percentage: 42,
    daysLeft: 14,
    assetType: 'Residential',
    tokenSupply: 1000,
    tokenPrice: '€320',
    expectedReturn: '8-12%',
    investmentPeriod: '5 years',
    minInvestment: '€1,000'
  };

  const gallery = [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?w=800',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
  ];

  const features = [
    { icon: '✓', text: '24/7 security & surveillance', checked: true },
    { icon: '✓', text: 'Underground parking', checked: true },
    { icon: '✓', text: 'Modern architecture', checked: true },
    { icon: '✓', text: 'Energy-efficient systems', checked: true },
    { icon: '✓', text: 'Rooftop terrace', checked: true },
    { icon: '✓', text: 'Fitness center', checked: true }
  ];


  const timeline = [
    {
      phase: 'Foundation & Structure',
      status: 'Completed',
      description: 'Foundation work and main structure construction completed',
      amount: '€180,000',
      info: 'Verified on-chain',
      percentage: 100
    },
    {
      phase: 'Interior Construction',
      status: 'In Progress',
      description: 'Apartment interiors, plumbing, and electrical systems',
      amount: '€320,000',
      info: '65% Complete',
      percentage: 65
    },
    {
      phase: 'Finishing & Amenities',
      status: 'Pending',
      description: 'Final touches, amenities installation, and landscaping',
      amount: '€250,000',
      info: 'Scheduled Q2 2025',
      percentage: 0
    }
  ];

  const documents = [
    { name: 'Project Whitepaper', icon: 'file', size: '2.5 MB' },
    { name: 'Legal Documents', icon: 'file', size: '1.8 MB' },
    { name: 'Financial Summary', icon: 'file', size: '890 KB' },
    { name: 'Property Deed', icon: 'file', size: '1.2 MB' }
  ];

  return (
    <div className="asset-details">
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
            <a href="#mint-tokens" onClick={(e) => { e.preventDefault(); onMintTokens && onMintTokens(projectData); }} className="nav-link">Mint Tokens</a>
            <a href="#trading" onClick={(e) => { e.preventDefault(); onTrading && onTrading(projectData); }} className="nav-link">Trading</a>
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

      <div className="hero-section">
        <div className="hero-image">
          <img src={gallery[0]} alt={projectData.name} />
          <div className="hero-overlay">
            <div className="container">
              <div className="hero-badge-row">
                <span className="hero-status-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {projectData.status}
                </span>
                <span className="hero-location-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {projectData.location}
                </span>
              </div>
              <h1 className="hero-title">{projectData.name}</h1>
              <div className="hero-stats-cards">
                <div className="hero-stat-card">
                  <div className="hero-stat-value orange">{projectData.goal}</div>
                  <div className="hero-stat-label">Total Budget</div>
                </div>
                <div className="hero-stat-card">
                  <div className="hero-stat-value green">{projectData.raised}</div>
                  <div className="hero-stat-label">Raised</div>
                </div>
                <div className="hero-stat-card">
                  <div className="hero-stat-value">43%</div>
                  <div className="hero-stat-label">Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="details-content">
        <div className="container">
          <div className="content-grid">
            <div className="content-main">
              <section className="section">
                <h2 className="section-title">Project Gallery</h2>
                <div className="gallery-grid">
                  {gallery.map((img, index) => (
                    <div key={index} className="gallery-item">
                      <img src={img} alt={`Gallery ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="section">
                <h2 className="section-title">Project Overview</h2>
                <p className="section-text" style={{color: '#64748b', lineHeight: '1.7'}}>
                  Zagreb Tower A represents the pinnacle of modern residential development in Croatia's capital. 
                  This premium project features 120 luxury apartments across 15 floors, offering residents 
                  unparalleled views of the city and state-of-the-art amenities.
                </p>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '32px'}}>
                  <div>
                    <h3 style={{fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px'}}>
                      Property Features
                    </h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#10b981', fontSize: '16px'}}>✓</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>120 luxury apartments</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#10b981', fontSize: '16px'}}>✓</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>15-story building</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#10b981', fontSize: '16px'}}>✓</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>Underground parking</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#10b981', fontSize: '16px'}}>✓</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>Rooftop terrace</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#10b981', fontSize: '16px'}}>✓</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>Fitness center</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px'}}>
                      Investment Highlights
                    </h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#f59e0b', fontSize: '16px'}}>📈</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>Prime location</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#f59e0b', fontSize: '16px'}}>📈</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>High rental demand</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#f59e0b', fontSize: '16px'}}>📈</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>Strong appreciation potential</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#f59e0b', fontSize: '16px'}}>📈</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>Experienced developer</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#f59e0b', fontSize: '16px'}}>📈</span>
                        <span style={{color: '#64748b', fontSize: '14px'}}>Transparent blockchain tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section">
                <h2 className="section-title">Construction Timeline</h2>
                <div className="timeline">
                  {timeline.map((phase, index) => (
                    <div key={index} className="timeline-item">
                      <div className={`timeline-icon-container ${phase.status.toLowerCase().replace(' ', '-')}`}>
                        {phase.status === 'Completed' ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : phase.status === 'In Progress' ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h3 className="timeline-title">{phase.phase}</h3>
                          <span className={`timeline-status-badge ${phase.status.toLowerCase().replace(' ', '-')}`}>
                            {phase.status}
                          </span>
                        </div>
                        <p className="timeline-description">{phase.description}</p>
                        <div className="timeline-footer">
                          <span className="timeline-amount">{phase.amount} • {phase.info}</span>
                        </div>
                        {phase.status === 'In Progress' && phase.percentage > 0 && (
                          <div className="timeline-progress">
                            <div 
                              className="timeline-progress-bar" 
                              style={{width: `${phase.percentage}%`}}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="content-sidebar">
              <div className="info-card">
                <h3 className="info-card-title">Token Information</h3>
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-label">Token Price</span>
                    <span className="info-value">€1.00</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Total Supply</span>
                    <span className="info-value">750,000 ZTA</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Minted</span>
                    <span className="info-value">320,000 ZTA</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Available</span>
                    <span className="info-value" style={{color: '#10b981'}}>430,000 ZTA</span>
                  </div>
                </div>
                <div style={{
                  background: '#fef3c7',
                  padding: '12px',
                  borderRadius: '8px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{color: '#f59e0b', fontSize: '16px'}}>⏰</span>
                  <div>
                    <div style={{color: '#f59e0b', fontSize: '12px', fontWeight: '500'}}>Minting ends in</div>
                    <div style={{color: '#f59e0b', fontSize: '18px', fontWeight: '700'}}>15 days</div>
                  </div>
                </div>
                <button className="mint-button" style={{
                  background: '#1e40af',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  width: '100%',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}>
                  Mint Tokens
                </button>
                <button className="trade-button" style={{
                  background: 'white',
                  color: '#1e40af',
                  border: '2px solid #1e40af',
                  padding: '12px',
                  borderRadius: '8px',
                  width: '100%',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}>
                  Trade Tokens
                </button>
              </div>

              <div className="info-card">
                <h3 className="info-card-title">Financial Summary</h3>
                
                <div style={{marginBottom: '16px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{fontSize: '13px', color: '#64748b'}}>Progress</span>
                    <span style={{fontSize: '14px', fontWeight: '600', color: '#1e293b'}}>43%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '43%',
                      height: '100%',
                      background: '#3b82f6',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '6px'}}>
                    <span style={{fontSize: '12px', color: '#64748b'}}>€320,000</span>
                    <span style={{fontSize: '12px', color: '#64748b'}}>€750,000</span>
                  </div>
                </div>

                <div className="info-list">
                  <div className="info-row">
                    <span className="info-label">Total Budget</span>
                    <span className="info-value" style={{fontWeight: '700'}}>€750,000</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Raised</span>
                    <span className="info-value" style={{color: '#10b981', fontWeight: '700'}}>€320,000</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Remaining</span>
                    <span className="info-value" style={{fontWeight: '700'}}>€430,000</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Contingency</span>
                    <span className="info-value" style={{fontWeight: '700'}}>€50,000</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3 className="info-card-title">Project Documents</h3>
                <div className="documents-sidebar-list">
                  {documents.map((doc, index) => (
                    <div key={index} className="document-sidebar-item">
                      <span className="document-sidebar-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </span>
                      <div className="document-sidebar-info">
                        <div className="document-sidebar-name">{doc.name}</div>
                        <div className="document-sidebar-size">{doc.size}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetails;
