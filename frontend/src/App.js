import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ClientMarket from './components/client_market';
import AdminDashboard from './components/AdminDashboard';
import SubmitProject from './components/SubmitProject';

function AppContent() {
  const { isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('marketplace');
  const [selectedProject, setSelectedProject] = useState(null);

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setCurrentView('details');
  };

  const handleMintTokens = (project) => {
    if (project) {
      setSelectedProject(project);
    }
    setCurrentView('mint');
  };

  const handleTrading = (project) => {
    if (project) {
      setSelectedProject(project);
    }
    setCurrentView('trading');
  };

  const handlePortfolio = () => {
    setCurrentView('portfolio');
  };

  const handleBackToMarketplace = () => {
    setCurrentView('marketplace');
    setSelectedProject(null);
  };

  const handleAdminDashboard = () => {
    setCurrentView('admin');
  };

  const handleSubmitProject = () => {
    setCurrentView('submit');
  };

  return (
    <div className="App">
      {currentView === 'marketplace' && (
        <ClientMarket 
          onViewDetails={handleViewDetails}
          onMintTokens={handleMintTokens}
          onTrading={handleTrading}
          onPortfolio={handlePortfolio}
          onAdmin={handleAdminDashboard}
          onSubmitProject={handleSubmitProject}
        />
      )}
      {currentView === 'admin' && isAdmin && (
        <AdminDashboard onBack={handleBackToMarketplace} />
      )}
      {currentView === 'submit' && (
        <SubmitProject 
          onBack={handleBackToMarketplace}
          onSuccess={handleBackToMarketplace}
        />
      )}
      {currentView === 'details' && (
        <div style={{ padding: '2rem', color: 'white', background: '#0f172a', minHeight: '100vh' }}>
          <button onClick={handleBackToMarketplace} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
            ← Back
          </button>
          <h2>{selectedProject?.name}</h2>
          <p>{selectedProject?.location}</p>
          <p>Status: {selectedProject?.status}</p>
        </div>
      )}
      {currentView === 'mint' && (
        <div style={{ padding: '2rem', color: 'white', background: '#0f172a', minHeight: '100vh' }}>
          <button onClick={handleBackToMarketplace} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
            ← Back
          </button>
          <h2>Mint Tokens</h2>
          <p>Minting interface coming soon...</p>
        </div>
      )}
      {currentView === 'trading' && (
        <div style={{ padding: '2rem', color: 'white', background: '#0f172a', minHeight: '100vh' }}>
          <button onClick={handleBackToMarketplace} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
            ← Back
          </button>
          <h2>Trading</h2>
          <p>Trading interface coming soon...</p>
        </div>
      )}
      {currentView === 'portfolio' && (
        <div style={{ padding: '2rem', color: 'white', background: '#0f172a', minHeight: '100vh' }}>
          <button onClick={handleBackToMarketplace} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
            ← Back
          </button>
          <h2>My Portfolio</h2>
          <p>Portfolio view coming soon...</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
