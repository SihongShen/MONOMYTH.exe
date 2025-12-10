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
          href="https://www.notion.so/Final-Project-Documentation-2c37c8dca34580c48ec7cbef7160073a?source=copy_link" 
          target="_blank" 
          rel="noopener noreferrer"
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