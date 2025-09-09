// src/App.js - Add debug logging
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Index from './components/Index';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';

console.log('📦 App.js loaded successfully');

function App() {
  console.log('🔧 App component rendering');
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
