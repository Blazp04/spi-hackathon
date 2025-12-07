import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import './SubmitProject.css';

const SubmitProject = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
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
      <header className="submit-header">
        <div className="submit-header-content">
          <div className="title-section">
            <button className="back-btn" onClick={onBack}>
              ← Back
            </button>
            <h1>Submit New Property</h1>
          </div>
          <div className="user-info">
            <span className="wallet-address">
              {user?.wallet?.slice(0, 6)}...{user?.wallet?.slice(-4)}
            </span>
          </div>
        </div>
      </header>

      <div className="submit-content">
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
  );
};

export default SubmitProject;
