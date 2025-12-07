import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ClientMarket from './components/client_market';
import AdminDashboard from './components/AdminDashboard';
import SubmitProject from './components/SubmitProject';
import AssetDetails from './components/asset_details';
import MintTokens from './components/mint_tokens';
import Portfolio from './components/portofolio';
import TradingScreen from './components/trading_screen';

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
        <AssetDetails 
          project={selectedProject}
          onBack={handleBackToMarketplace}
          onMintTokens={handleMintTokens}
          onTrading={handleTrading}
          onMarket2={handleBackToMarketplace}
          onPortfolio={handlePortfolio}
        />
      )}
      {currentView === 'mint' && (
        <MintTokens 
          project={selectedProject}
          onBack={handleBackToMarketplace}
          onMarket2={handleBackToMarketplace}
          onPortfolio={handlePortfolio}
          onTrading={handleTrading}
        />
      )}
      {currentView === 'trading' && (
        <TradingScreen 
          project={selectedProject}
          onBack={handleBackToMarketplace}
          onMarket2={handleBackToMarketplace}
          onPortfolio={handlePortfolio}
          onMintTokens={handleMintTokens}
        />
      )}
      {currentView === 'portfolio' && (
        <Portfolio 
          onBack={handleBackToMarketplace}
          onMarket2={handleBackToMarketplace}
          onMintTokens={handleMintTokens}
          onTrading={handleTrading}
        />
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
