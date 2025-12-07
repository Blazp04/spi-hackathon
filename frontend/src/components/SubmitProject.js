import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import './client_market.css';
import './SubmitProject.css';

const SubmitProject = ({ onBack, onSuccess, onMarketplace, onMintTokens, onTrading, onPortfolio, onAdmin }) => {
  const { user, isAuthenticated, isAdmin, loading: authLoading, connectWallet, disconnect, hasMetaMask, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    price: '',
    goal: '',
    token_price: '',
    min_investment: '',
    images: []
  });
  const [imageUrl, setImageUrl] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }));
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Project name is required');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        goal: formData.goal ? parseFloat(formData.goal) : null,
        token_price: formData.token_price ? parseFloat(formData.token_price) : null,
        min_investment: formData.min_investment ? parseFloat(formData.min_investment) : null
      };

      await projectsAPI.create(projectData);
      alert('Project submitted for approval!');
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit project. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-project">
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
              <a href="#submit" className="nav-link active">Submit Property</a>
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

      <div className="submit-content">
        <div className="container">
          <div className="page-header">
            <h1>Submit New Property</h1>
          </div>
          
          <div className="submit-layout">
            <form className="submit-form" onSubmit={handleSubmit}>
            <div className="form-section">
            <h3>Property Details</h3>
            
            <div className="form-group">
              <label htmlFor="name">Property Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Zagreb Tower A – Phase I"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the property, construction plans, and investment opportunity..."
                rows={5}
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Zagreb, Croatia"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Financial Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Property Price (€)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g., 750000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="goal">Funding Goal (€)</label>
                <input
                  type="number"
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  placeholder="e.g., 500000"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="token_price">Token Price (€)</label>
                <input
                  type="number"
                  id="token_price"
                  name="token_price"
                  value={formData.token_price}
                  onChange={handleChange}
                  placeholder="e.g., 125"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="min_investment">Minimum Investment (€)</label>
                <input
                  type="number"
                  id="min_investment"
                  name="min_investment"
                  value={formData.min_investment}
                  onChange={handleChange}
                  placeholder="e.g., 1000"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Images</h3>
            
            <div className="form-group">
              <label>Add Image URLs</label>
              <div className="image-input-row">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <button type="button" onClick={handleAddImage} className="add-image-btn">
                  Add
                </button>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="image-preview-grid">
                {formData.images.map((url, index) => (
                  <div key={index} className="image-preview">
                    <img src={url} alt={`Preview ${index + 1}`} />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveImage(index)}
                      className="remove-image-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onBack} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
            </form>

            <div className="info-panel">
              <h4>📋 Submission Guidelines</h4>
              <ul>
                <li>All submissions are reviewed by our admin team</li>
                <li>Approval typically takes 24-48 hours</li>
                <li>Provide accurate financial details</li>
                <li>High-quality images increase approval chances</li>
                <li>You will be notified once reviewed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitProject;
