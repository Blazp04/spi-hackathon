import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasMetaMask = typeof window !== 'undefined' && window.ethereum;

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { user } = await authAPI.getMe();
          setUser(user);
        } catch (err) {
          console.error('Failed to load user:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const connectWallet = useCallback(async () => {
    if (!hasMetaMask) {
      setError('Please install MetaMask to continue');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const wallet = accounts[0];
      const signer = await provider.getSigner();

      const { nonce } = await authAPI.getNonce(wallet);

      const signature = await signer.signMessage(nonce);

      const { token, user } = await authAPI.verify(wallet, signature);

      localStorage.setItem('token', token);
      setUser(user);

    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setLoading(false);
    }
  }, [hasMetaMask]);

  const disconnect = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    if (hasMetaMask) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (user && accounts[0].toLowerCase() !== user.wallet) {
          disconnect();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [hasMetaMask, user, disconnect]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    hasMetaMask,
    connectWallet,
    disconnect
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
