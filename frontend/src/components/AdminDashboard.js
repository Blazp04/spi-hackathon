import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = ({ onBack }) => {
  const { user } = useAuth();
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

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `€${Number(price).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red'
    };
    return colors[status] || 'badge-gray';
  };

  const displayProjects = activeTab === 'pending' ? pendingProjects : allProjects;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title-section">
            <button className="back-btn" onClick={onBack}>
              ← Back to Marketplace
            </button>
            <h1>Admin Dashboard</h1>
            <span className="admin-badge">ADMIN</span>
          </div>
          <div className="admin-user">
            <span className="wallet-address">
              {user?.wallet?.slice(0, 6)}...{user?.wallet?.slice(-4)}
            </span>
          </div>
        </div>
      </header>

      <div className="admin-content">
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
                  {activeTab === 'pending' && <th>Actions</th>}
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
                      <span className={`status-badge ${getStatusBadge(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>{new Date(project.created_at).toLocaleDateString()}</td>
                    {activeTab === 'pending' && (
                      <td className="actions-cell">
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
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
