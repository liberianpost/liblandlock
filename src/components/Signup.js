import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    dssn: '',
    password: '',
    confirmPassword: ''
  });
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const navigate = useNavigate();

  // API Base URL - Updated with /api path
  const API_BASE_URL = 'https://api.liblandlock.com/api';

  const showError = (msg) => {
    setError(msg);
    setSuccess('');
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setError('');
  };

  const hideMessages = () => {
    setError('');
    setSuccess('');
  };

  const verifyDSSN = async (dssn) => {
    const url = `${API_BASE_URL}/llverify-dssn`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ dssn })
    });
    
    const text = await response.text();
    const data = JSON.parse(text);
    
    if (!response.ok) {
      throw new Error(data.message || `Server error: ${response.status}`);
    }
    
    return data;
  };

  const registerUser = async (dssn, password) => {
    const url = `${API_BASE_URL}/llregister`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ dssn, password })
    });
    
    const text = await response.text();
    const data = JSON.parse(text);
    
    if (!response.ok) {
      throw new Error(data.message || `Server error: ${response.status}`);
    }
    
    return data;
  };

  const handleDssnCheck = async () => {
    const dssn = formData.dssn.trim();
    if (!dssn) {
      showError('Please enter a DSSN');
      return;
    }
    
    hideMessages();
    setLoading(true);

    try {
      const data = await verifyDSSN(dssn);
      if (data.success) {
        showSuccess('DSSN verified! Please create your password.');
        setEmployeeInfo(data.data);
        setShowPasswordSection(true);
      } else {
        showError(data.message || 'Invalid DSSN');
      }
    } catch (err) {
      console.error('DSSN verification error:', err);
      showError(err.message || 'Failed to verify DSSN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { dssn, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    hideMessages();
    setLoading(true);

    try {
      const data = await registerUser(dssn.trim(), password);
      if (data.success) {
        showSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => { 
          navigate('/login'); 
        }, 2000);
      } else {
        showError(data.message || 'Registration failed');
      }
    } catch(err) {
      console.error('Registration error:', err);
      showError(err.message || 'Registration failed. Please try again.');
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
    <div className="signup-container">
      <div className="container">
        <div className="auth-form">
          <h1>Create Account</h1>
          <p className="subtitle">Sign up to get started</p>
          
          <form id="signupForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="dssn">DSSN (Digital Social Security Number)</label>
              <div className="input-group">
                <input 
                  type="text" 
                  id="dssn" 
                  name="dssn"
                  value={formData.dssn}
                  onChange={handleChange}
                  required 
                  placeholder="Enter your DSSN"
                  disabled={showPasswordSection}
                />
                {!showPasswordSection && (
                  <button 
                    type="button" 
                    onClick={handleDssnCheck}
                    disabled={loading || !formData.dssn}
                    className="verify-btn"
                  >
                    {loading ? 'Verifying...' : 'Verify DSSN'}
                  </button>
                )}
              </div>
            </div>
            
            {employeeInfo && (
              <div className="employee-details">
                <h3>Employee Information</h3>
                <p><strong>Name:</strong> {employeeInfo.first_name} {employeeInfo.last_name}</p>
                {employeeInfo.image_url && (
                  <img 
                    src={employeeInfo.image_url} 
                    alt="Employee" 
                    className="employee-image" 
                  />
                )}
              </div>
            )}
            
            {showPasswordSection && (
              <div className="password-section">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required 
                    placeholder="Create a password (min. 6 characters)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required 
                    placeholder="Confirm your password"
                  />
                </div>
                <button type="submit" className="signup-btn" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            )}
          </form>
          
          <div className="form-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
      </div>
    </div>
  );
}

export default Signup;
