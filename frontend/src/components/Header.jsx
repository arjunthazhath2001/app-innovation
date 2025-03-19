// src/components/Header.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, user, userRole, logout } = useAuth();

  return (
    <header style={{ padding: '1rem', backgroundColor: '#f5f5f5', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Auth App</h1>
        <nav>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span>Welcome, {user?.firstname || 'User'}</span>
              {userRole === 'admin' && <Link to="/admin/users">User List</Link>}
              <Link to="/dashboard">Dashboard</Link>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;