// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              
              <Route element={<PrivateRoute requiredRole="admin" />}>
                <Route path="/admin/users" element={<UserList />} />
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;