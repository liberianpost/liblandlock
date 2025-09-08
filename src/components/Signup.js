import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css'; // We'll create this CSS file

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

  // API Base URL - Updated to use NGINX proxy
  const API_BASE_URL = 'https://api.liblandlock.com';

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
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ dssn })
      });
      
      // Get the response text first to handle both JSON and non-JSON responses
      const responseText = await response.text();
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        
        if (!response.ok) {
          throw new Error(data.message || `Server error: ${response.status}`);
        }
        
        return data;
      } catch (jsonError) {
        // If parsing as JSON fails, handle as text response
        if (!response.ok) {
          throw new Error(responseText || `Server error: ${response.status}`);
        } else {
          throw new Error('Invalid response format from server');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      throw new Error(error.message || 'Network error. Please try again.');
    }
  };

  const registerUser = async (dssn, password) => {
    const url = `${API_BASE_URL}/llregister`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ dssn, password })
      });
      
      // Get the response text first to handle both JSON and non-JSON responses
      const responseText = await response.text();
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        
        if (!response.ok) {
          throw new Error(data.message || `Server error: ${response.status}`);
        }
        
        return data;
      } catch (jsonError) {
        // If parsing as JSON fails, handle as text response
        if (!response.ok) {
          throw new Error(responseText || `Server error: ${response.status}`);
        } else {
          throw new Error('Invalid response format from server');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      throw new Error(error.message || 'Network error. Please try again.');
    }
  };

  const handleDssnCheck = async () => {
    const dssn = formData.dssn.trim();
    if (!dssn) return showError('Please enter a DSSN');
    hideMessages();

    setLoading(true);

    try {
      const data = await verifyDSSN(dssn);
      if (data.success) {
        showSuccess('DSSN verified. Please create your password.');
        setEmployeeInfo(data.data);
        setShowPasswordSection(true);
      } else {
        showError(data.message);
        setEmployeeInfo(null);
        setShowPasswordSection(false);
      }
    } catch (err) {
      console.error('DSSN verification error:', err);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dssn = formData.dssn.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (password !== confirmPassword) return showError('Passwords do not match');
    if (password.length < 6) return showError('Password must be at least 6 characters');

    hideMessages();
    setLoading(true);

    try {
      const data = await registerUser(dssn, password);
      if (data.success) {
        showSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => { 
          navigate('/login'); 
        }, 2000);
      } else {
        showError(data.message);
      }
    } catch(err) {
      console.error('Registration error:', err);
      showError(err.message);
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
          <h1>Sign Up</h1>
          <form id="signupForm" onSubmit={handleSubmit}>
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
              <button 
                type="button" 
                onClick={handleDssnCheck}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify DSSN'}
              </button>
            </div>
            
            {employeeInfo && (
              <div id="employeeInfo" className="employee-details">
                <h3>Employee Information</h3>
                <p><strong>Name:</strong> <span id="employeeName">{employeeInfo.first_name} {employeeInfo.last_name}</span></p>
                {employeeInfo.image_url && (
                  <img 
                    id="employeeImage" 
                    src={employeeInfo.image_url} 
                    alt="Employee" 
                    className="employee-image" 
                  />
                )}
              </div>
            )}
            
            {showPasswordSection && (
              <div id="passwordSection">
                <div className="form-group">
                  <label htmlFor="password">Password:</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required 
                    placeholder="Create a password" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password:</label>
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
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            )}
          </form>
          <p>Already have an account? <Link to="/login">Login here</Link></p>
          {error && <p id="errorMsg" className="error">{error}</p>}
          {success && <p id="successMsg" className="success">{success}</p>}
        </div>
      </div>
    </div>
  );
}

export default Signup;
