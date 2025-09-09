// src/index.js - Add debug logging
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 React index.js loaded successfully');

const rootElement = document.getElementById('root');
console.log('📋 Root element found:', rootElement);

if (!rootElement) {
  console.error('❌ CRITICAL: No root element found!');
} else {
  console.log('✅ Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('✅ Rendering App component...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ React app rendered successfully');
}
