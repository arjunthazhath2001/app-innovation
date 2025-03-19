// src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <h3>Welcome, {user?.firstname} {user?.lastname}!</h3>
        <p>You are logged in successfully.</p>
      </div>
    </div>
  );
};

export default Dashboard;