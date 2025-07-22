import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/custom.css';

// Function to prompt adding to home screen
const promptAddToHomeScreen = () => {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
    alert('To install this app, tap the Share button in Safari, then select "Add to Home Screen".');
  }
};

document.addEventListener('DOMContentLoaded', promptAddToHomeScreen);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);