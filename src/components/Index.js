import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function Index() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('Index component mounted - checking authentication');
    
    try {
      // Firebase configuration
      const firebaseConfig = {
        apiKey: "AIzaSyCAXigi0D23EjboMxulyXNb0ii-tpw0Fk0",
        authDomain: "liblandlock.firebaseapp.com",
        projectId: "liblandlock",
        storageBucket: "liblandlock.firebasestorage.app",
        messagingSenderId: "1019606713296",
        appId: "1:1019606713296:web:4990faf32bcaf0a21dafd5"
      };

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      
      console.log('Firebase initialized successfully');
      
      // Check if user is already logged in
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Firebase auth state changed:', user ? 'User found' : 'No user');
        if (user) {
          console.log('User authenticated, redirecting to dashboard');
          // Small delay to ensure UI renders before redirect
          setTimeout(() => navigate('/dashboard'), 100);
        }
        setIsCheckingAuth(false);
      });
      
      // Also check for localStorage user data (for your custom auth)
      const userData = localStorage.getItem('user');
      if (userData) {
        console.log('Local storage user found, redirecting to dashboard');
        // Small delay to ensure UI renders before redirect
        setTimeout(() => navigate('/dashboard'), 100);
        setIsCheckingAuth(false);
      }

      // Cleanup subscription
      return () => {
        console.log('Cleaning up auth subscription');
        unsubscribe();
      };
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setIsCheckingAuth(false);
    }
  }, [navigate]);

  const handleLogin = () => {
    console.log('Login button clicked');
    navigate('/login');
  };

  const handleSignup = () => {
    console.log('Signup button clicked');
    navigate('/signup');
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div style={styles.body}>
        <div style={styles.container}>
          <h1 style={styles.title}>Liberia Land Lock Secure Portal</h1>
          <p style={styles.description}>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.title}>Liberia Land Lock Secure Portal</h1>
        <p style={styles.description}>You must be authenticated to access this site.</p>
        <div style={styles.authButtons}>
          <button style={styles.button} onClick={handleLogin}>Login</button>
          <button style={styles.button} onClick={handleSignup}>Sign Up</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    padding: '20px',
    margin: 0,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  container: {
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    maxWidth: '500px',
    width: '100%'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
  },
  description: {
    fontSize: '1.2rem',
    marginBottom: '30px',
    opacity: '0.9'
  },
  authButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px'
  },
  button: {
    padding: '12px 25px',
    borderRadius: '50px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.3)'
    }
  }
};

export default Index;
