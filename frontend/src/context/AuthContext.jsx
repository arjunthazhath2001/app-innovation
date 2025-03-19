// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      fetchUserProfile(role);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (role) => {
    try {
      const response = await getProfile(role);
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setError('Failed to load user profile');
        logout();
      }
    } catch (error) {
      setError('Failed to fetch user profile');
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUserRole(role);
    fetchUserProfile(role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole(null);
    setUser(null);
  };

  const contextValue = {
    user,
    loading,
    isAuthenticated,
    userRole,
    error,
    login,
    logout,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
