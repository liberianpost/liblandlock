import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    dssn: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // API Base URL - Updated with /api path
  const API_BASE_URL = 'https://api.liblandlock.com/api';

  useEffect(() => {
    // Optional: Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { dssn, password } = formData;
    
    // Validate input
    if (!dssn || !password) {
      setError('Please enter both DSSN and password');
      return;
    }
    
    // Show loading state
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/lllogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ dssn, password })
      });
      
      // Parse response
      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid response from server');
      }
      
      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.data));
        localStorage.setItem('token', data.token || '');
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="container">
        <div className="auth-form">
          <h1>Welcome Back</h1>
          <p className="subtitle">Login to your account</p>
          
          <form id="loginForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="dssn">DSSN (Digital Social Security Number)</label>
              <input 
                type="text" 
                id="dssn" 
                name="dssn"
                value={formData.dssn}
                onChange={handleChange}
                required 
                placeholder="Enter your DSSN"
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required 
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="form-footer">
            <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default Login;
