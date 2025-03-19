// src/pages/UserList.jsx
import { useState, useEffect } from 'react';
import { getUsersList } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserList = () => {
  const { userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsersList();
        
        if (response.data && response.data.users) {
          setUsers(response.data.users);
        } else {
          setError('Invalid response format');
        }
      } catch (err) {
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
    return <div>Loading users...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
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
                  borderRadius: '8px'
                }}
              >
                <h3>{user.firstname} {user.lastname}</h3>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>ID:</strong> {user._id}
                </p>
                <p>
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
};

export default UserList;
