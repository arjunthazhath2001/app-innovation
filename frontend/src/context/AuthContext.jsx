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
    
    console.log('Auth Context initialized with:', { hasToken: !!token, role });
    
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
      console.log('Fetching user profile for role:', role);
      const response = await getProfile(role);
      console.log('Profile response:', response);
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        console.log('User profile set:', response.data.user);
      } else {
        console.error('Invalid profile data:', response.data);
        setError('Failed to load user profile');
        logout();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch user profile');
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, role) => {
    console.log('Logging in with:', { token: token?.substring(0, 10) + '...', role });
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUserRole(role);
    fetchUserProfile(role);
  };

  const logout = () => {
    console.log('Logging out');
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