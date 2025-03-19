// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, verifyOtp } from '../services/api';
import OTPForm from '../components/OTPForm';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    role: 'users',
    enable2fa: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await register(formData);
      
      if (response.data.require2fa) {
        setShowOtp(true);
      } else {
        alert('Registration successful! Please login.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue) => {
    try {
      const response = await verifyOtp({
        email: formData.email,
        otp: otpValue,
        role: formData.role
      });
      
      if (response.data.verified) {
        alert('OTP verification successful! Please login.');
        navigate('/login');
      }
    } catch (err) {
      throw err;
    }
  };

  if (showOtp) {
    return <OTPForm onVerify={handleVerifyOtp} email={formData.email} role={formData.role} />;
  }

  return (
    <div>
      <h2>Register</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="firstname">First Name</label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="lastname">Last Name</label>
          <input
            type="text"
            id="lastname"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <div>Role</div>
          <label style={{ marginRight: '1rem' }}>
            <input
              type="radio"
              name="role"
              value="users"
              checked={formData.role === 'users'}
              onChange={handleChange}
            />
            User
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="admin"
              checked={formData.role === 'admin'}
              onChange={handleChange}
            />
            Admin
          </label>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>
            <input
              type="checkbox"
              name="enable2fa"
              checked={formData.enable2fa}
              onChange={handleChange}
            />
            Enable 2FA Authentication
          </label>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default Register;