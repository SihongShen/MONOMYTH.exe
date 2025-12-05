import React from 'react';
import './footer.css';

const Footer = () => {
  return (
    <footer className="monomyth-footer">
      <div className="footer-links">
        <a 
          href="https://github.com/SihongShen/MONOMYTH.exe" 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
        >
          GITHUB
        </a>

        <span className="separator">//</span>

        <a 
        //   href="https://your-documentation-url.com" 
        //   target="_blank" 
        //   rel="noopener noreferrer"
          className="footer-link"
        >
          DOCUMENTATION
        </a>
      </div>
      
      <div className="system-version">v.1.2.0</div>
    </footer>
  );
};

export default Footer;