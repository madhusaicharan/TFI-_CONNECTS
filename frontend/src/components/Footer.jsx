import React from 'react';
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="asme-footer-container">
      <div className="asme-footer-card">
        {/* Top Header & Logo */}
        <div className="asme-footer-top">
          <div className="asme-hashtag-logo">#</div>
          <p className="asme-copyright">© 2026 TFI_CONNECTS. All rights reserved.</p>
        </div>

        {/* 4 Column Navigation Grid */}
        <div className="asme-footer-grid">
          {/* Column 1: Product */}
          <div className="asme-footer-col">
            <h4 className="asme-col-header">Product</h4>
            <ul className="asme-col-links">
              <li><Link to="/movies">Features</Link></li>
              <li><Link to="/trending">Pricing</Link></li>
              <li><Link to="/records">Testimonials</Link></li>
              <li><Link to="/box-office">Integration</Link></li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div className="asme-footer-col">
            <h4 className="asme-col-header">Company</h4>
            <ul className="asme-col-links">
              <li><Link to="/trending">FAQs</Link></li>
              <li><Link to="/records">About Us</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Services</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="asme-footer-col">
            <h4 className="asme-col-header">Resources</h4>
            <ul className="asme-col-links">
              <li><Link to="/trending">Blog</Link></li>
              <li><Link to="/records">Changelog</Link></li>
              <li><Link to="/movies">Brand</Link></li>
              <li><Link to="/search">Help</Link></li>
            </ul>
          </div>

          {/* Column 4: Social Links */}
          <div className="asme-footer-col">
            <h4 className="asme-col-header">Social Links</h4>
            <ul className="asme-col-links social">
              <li>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <FaFacebookF size={15} />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <FaInstagram size={16} />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                  <FaYoutube size={16} />
                  <span>Youtube</span>
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <FaLinkedinIn size={16} />
                  <span>LinkedIn</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
