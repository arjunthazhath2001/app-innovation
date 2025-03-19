// src/pages/UserList.jsx
import { useState, useEffect } from 'react';
import { getUsersList } from '../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsersList();
        setUsers(response.data.users);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h2>User List</h2>
      
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          {users.map((user) => (
            <div 
              key={user._id} 
              style={{ 
                padding: '1rem', 
                marginBottom: '0.5rem', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            >
              <h3>{user.firstname} {user.lastname}</h3>
              <p>Email: {user.email}</p>
              <p>2FA Enabled: {user.enable2fa ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;