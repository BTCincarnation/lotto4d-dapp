// LoadingScreen.js
import React from 'react';
import logo from "./image/logo.png";
import "./LoadingScreen.css";

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
        <img src={logo} alt="Logo" className="spinning-logo" />
        <p>Loading...</p>
    
    </div>
  );
};

export default LoadingScreen;
