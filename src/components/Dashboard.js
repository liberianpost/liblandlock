import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandRegistrationModal from './LandRegistrationModal';
import './Dashboard.css';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [showLandRegistration, setShowLandRegistration] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
      return;
    }
    setUserData(user);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="header">
        <div className="header-images">
          <img src="liberiamap1.PNG" alt="Liberia Map" className="header-image" />
        </div>
        
        <div className="system-title">
          <h1 className="shiny-text">LIBERIA LAND LOCK SYSTEM</h1>
          <p className="shiny-subtext">Secure Land Management Portal</p>
        </div>
        
        <div className="header-images">
          <img src="liberiaseal.PNG" alt="Liberia Seal" className="header-image" />
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2 className="shiny-welcome">Welcome to Your Dashboard</h2>
          <p>You have successfully logged in to the secure portal</p>
        </div>
        
        <div className="user-cards">
          <div className="user-card">
            <div className="card-header">
              <img 
                id="userImage" 
                src={userData.image || 'https://via.placeholder.com/80'} 
                alt="User" 
                className="user-image" 
              />
              <div className="user-info">
                <h3 className="shiny-blue">{userData.first_name} {userData.last_name}</h3>
                <p>Registered User</p>
              </div>
            </div>
            
            <div className="card-details">
              <div className="detail-item">
                <span className="detail-label">DSSN:</span>
                <span className="detail-value">{userData.dssn || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{userData.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">User ID:</span>
                <span className="detail-value">{userData.user_id || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value" style={{ color: '#2ecc71' }}>Verified</span>
              </div>
            </div>
          </div>
          
          <div className="user-card">
            <div className="card-header">
              <div className="user-info">
                <h3 className="shiny-blue">System Information</h3>
                <p>Land Lock Portal</p>
              </div>
            </div>
            
            <div className="card-details">
              <div className="detail-item">
                <span className="detail-label">Last Login:</span>
                <span className="detail-value">Today</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Account Created:</span>
                <span className="detail-value">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Access Level:</span>
                <span className="detail-value">Standard</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Session Active:</span>
                <span className="detail-value" style={{ color: '#2ecc71' }}>Yes</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-map-marked-alt"></i>
            </div>
            <h3 className="shiny-blue">Land Records</h3>
            <p>Access and manage land ownership records and documents</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-file-contract"></i>
            </div>
            <h3 className="shiny-blue">Documents</h3>
            <p>View and download official land documents and certificates</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-search"></i>
            </div>
            <h3 className="shiny-blue">Search Portal</h3>
            <p>Search through land records and ownership information</p>
          </div>
          
          <div className="feature-card" onClick={() => setShowLandRegistration(true)}>
            <div className="feature-icon">
              <i className="fas fa-landmark"></i>
            </div>
            <h3 className="shiny-blue">Land Registration</h3>
            <p>Register new land parcels, owners, and survey information</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="shiny-blue">Security</h3>
            <p>Advanced security measures to protect land data</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-id-card"></i>
            </div>
            <h3 className="shiny-blue">DSSN Registration</h3>
            <p>Register and manage Digital Security Service Numbers</p>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="btn btn-primary">
            <i className="fas fa-cog"></i> Settings
          </button>
          <button className="btn btn-primary">
            <i className="fas fa-question-circle"></i> Help
          </button>
          <button onClick={handleLogout} className="btn btn-logout">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
      
      {showLandRegistration && (
        <LandRegistrationModal onClose={() => setShowLandRegistration(false)} />
      )}
      
      <div className="watermark">LLS</div>
    </div>
  );
}

export default Dashboard;
