import React from 'react';
import './header.css';

const Header = () => {
  return (
    <header className="monomyth-header">
      <div className="header-left">
        <div className="sub-info">
          VER 1.0.0
        </div>
        <div className="title-row">
          <h1 className="main-title">MONOMYTH</h1>
        </div>
      </div>

      <div className="header-right">
        <svg 
          className="status-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M2 12H5L8 5L11 19L14 12H22" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span className="status-text">SYSTEM STABLE</span>
      </div>
    </header>
  );
};

export default Header;