// src/pages/UserList.jsx
import { useState, useEffect } from 'react';
import { getUsersList } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserList = () => {

const UserList = () => {
  const { userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users list...');
        const response = await getUsersList();
        console.log('Users list response:', response);
        
        if (response.data && response.data.users) {
          setUsers(response.data.users);
        } else {
          setError('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (userRole !== 'admin') {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px' }}>
        <h3>Access Denied</h3>
        <p>You need admin privileges to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Loading users...</div>
        <div style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #3498db', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            backgroundColor: '#dc3545', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>User List</h2>
      
      {users.length === 0 ? (
        <div style={{ padding: '1rem', backgroundColor: '#e2e3e5', borderRadius: '4px', marginTop: '1rem' }}>
          <p>No users found in the system.</p>
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {users.map((user) => (
              <div 
                key={user._id} 
                style={{ 
                  padding: '1rem', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease',
                  backgroundColor: 'white'
                }}
              >
                <h3 style={{ marginTop: 0, color: '#333' }}>{user.firstname} {user.lastname}</h3>
                <p style={{ margin: '0.5rem 0', color: '#666' }}>
                  <strong>Email:</strong> {user.email}
                </p>
                <p style={{ margin: '0.5rem 0', color: '#666' }}>
                  <strong>ID:</strong> {user._id}
                </p>
                <p style={{ margin: '0.5rem 0', color: '#666' }}>
                  <strong>Verified:</strong> {user.isVerified ? 'Yes' : 'No'}
                </p>
              </div>
            ))}
          </div>
          <p>Total users: {users.length}</p>
        </div>
      )}
    </div>
  );
