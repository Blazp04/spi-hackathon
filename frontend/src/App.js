import React, { useState } from 'react';
import './App.css';
import ClientMarket from './components/client_market';
import AssetDetails from './components/asset_details';
import MintTokens from './components/mint_tokens';
import TradingScreen from './components/trading_screen';
import Portfolio from './components/portofolio';

function App() {
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

  const handleBackToDetails = () => {
    if (selectedProject) {
      setCurrentView('details');
    } else {
      handleBackToMarketplace();
    }
  };

  return (
    <div className="App">
      {currentView === 'marketplace' && (
        <ClientMarket 
          onViewDetails={handleViewDetails}
          onMintTokens={handleMintTokens}
          onTrading={handleTrading}
          onPortfolio={handlePortfolio}
        />
      )}
      {currentView === 'details' && (
        <AssetDetails 
          project={selectedProject} 
          onBack={handleBackToMarketplace}
          onMintTokens={handleMintTokens}
          onTrading={handleTrading}
        />
      )}
      {currentView === 'mint' && (
        <MintTokens 
          project={selectedProject} 
          onBack={handleBackToDetails}
        />
      )}
      {currentView === 'trading' && (
        <TradingScreen 
          project={selectedProject}
          onBack={handleBackToMarketplace}
        />
      )}
      {currentView === 'portfolio' && (
        <Portfolio 
          onBack={handleBackToMarketplace}
        />
      )}
    </div>
  );
}

export default App;
