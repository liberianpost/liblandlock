import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // We'll create this CSS file

function Login() {
  const [formData, setFormData] = useState({
    dssn: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // API Base URL - Updated to use NGINX proxy
  const API_BASE_URL = 'https://api.liblandlock.com';

  useEffect(() => {
    // Optional: Check if user is already logged in
    if (localStorage.getItem('user')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dssn = formData.dssn;
    const password = formData.password;
    
    // Show loading state
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/lllogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dssn, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.data));
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      // Reset loading state
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
          <h1>Login</h1>
          <form id="loginForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="dssn">DSSN:</label>
              <input 
                type="text" 
                id="dssn" 
                name="dssn"
                value={formData.dssn}
                onChange={handleChange}
                required 
                placeholder="Enter your DSSN" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required 
                placeholder="Enter your password" 
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
          {error && <p id="errorMsg" className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default Login;
