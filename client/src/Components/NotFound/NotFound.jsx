import React from 'react';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-container">
      <h1 className="notfound-title">404</h1>
      <p className="notfound-message">Oops! The page you're looking for doesn't exist.</p>
      <a href="/" className="notfound-homebtn">Go Home</a>
    </div>
  );
}
