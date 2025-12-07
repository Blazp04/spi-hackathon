import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import './client_market.css';
import './AdminDashboard.css';

const AdminDashboard = ({ onBack, onMarketplace, onMintTokens, onTrading, onPortfolio, onSubmitProject }) => {
  const { user, isAuthenticated, isAdmin, loading: authLoading, connectWallet, disconnect, hasMetaMask, error: authError } = useAuth();
  const [pendingProjects, setPendingProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [pending, all] = await Promise.all([
        projectsAPI.getAll('pending'),
        projectsAPI.getAll()
      ]);
      setPendingProjects(pending.projects || []);
      setAllProjects(all.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (projectId) => {
    setActionLoading(projectId);
    try {
      await projectsAPI.approve(projectId);
      await loadProjects();
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (projectId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    setActionLoading(projectId);
    try {
      await projectsAPI.reject(projectId, reason || '');
      await loadProjects();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeStatus = async (projectId, newStatus) => {
    if (!window.confirm(`Change project status to "${newStatus}"?`)) {
      return;
    }
    
    setActionLoading(projectId);
    try {
      await projectsAPI.changeStatus(projectId, newStatus);
      await loadProjects();
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Failed to change project status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(projectId);
    try {
      await projectsAPI.delete(projectId);
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete project');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `€${Number(price).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
      minting: 'badge-blue',
      building: 'badge-orange',
      trading: 'badge-purple'
    };
    return colors[status] || 'badge-gray';
  };

  const displayProjects = activeTab === 'pending' ? pendingProjects : allProjects;

  return (
    <div className="admin-dashboard">
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
            <a href="#portfolio" onClick={(e) => { e.preventDefault(); onPortfolio && onPortfolio(); }} className="nav-link">Portfolio</a>
            {isAdmin && (
              <a href="#admin" className="nav-link admin-link active">Admin Dashboard</a>
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

      <div className="admin-content">
        <div className="container">
          <div className="page-header">
            <h1>Admin Dashboard</h1>
          </div>

        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-number">{pendingProjects.length}</span>
            <span className="stat-label">Pending Review</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {allProjects.filter(p => p.status === 'approved').length}
            </span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {allProjects.filter(p => p.status === 'rejected').length}
            </span>
            <span className="stat-label">Rejected</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{allProjects.length}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </div>

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Review ({pendingProjects.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Projects ({allProjects.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading projects...</div>
        ) : displayProjects.length === 0 ? (
          <div className="empty-state">
            {activeTab === 'pending' 
              ? 'No pending projects to review'
              : 'No projects found'}
          </div>
        ) : (
          <div className="projects-table-container">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Goal</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayProjects.map(project => (
                  <tr key={project.id}>
                    <td>#{project.id}</td>
                    <td className="project-name">{project.name}</td>
                    <td>{project.location || '-'}</td>
                    <td>{formatPrice(project.price)}</td>
                    <td>{formatPrice(project.goal)}</td>
                    <td className="wallet-cell">
                      {project.owner_wallet?.slice(0, 6)}...{project.owner_wallet?.slice(-4)}
                    </td>
                    <td>
                      <div className="status-actions">
                        <span className={`badge ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                        <select 
                          className="status-select"
                          value={project.status}
                          onChange={(e) => handleChangeStatus(project.id, e.target.value)}
                          disabled={actionLoading === project.id}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="minting">Minting</option>
                          <option value="building">Building</option>
                          <option value="trading">Trading</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </td>
                    <td>{new Date(project.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      {activeTab === 'pending' && (
                        <>
                          <button 
                            className="approve-btn"
                            onClick={() => handleApprove(project.id)}
                            disabled={actionLoading === project.id}
                          >
                            {actionLoading === project.id ? '...' : '✓ Approve'}
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => handleReject(project.id)}
                            disabled={actionLoading === project.id}
                          >
                            {actionLoading === project.id ? '...' : '✕ Reject'}
                          </button>
                        </>
                      )}
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(project.id)}
                        disabled={actionLoading === project.id}
                        title="Delete project"
                      >
                        {actionLoading === project.id ? '...' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
