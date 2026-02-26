import React from 'react';
import { FaPlay, FaShieldAlt, FaLock, FaBan, FaDatabase, FaEnvelope, FaInstagram, FaFacebook, FaBriefcase } from 'react-icons/fa';

interface FooterProps {
  onModalOpen: (modal: 'privacy' | 'terms' | 'disclaimer' | 'how-it-works' | 'features' | 'security' | 'contact' | 'careers') => void;
}

const Footer: React.FC<FooterProps> = ({ onModalOpen }) => {
  return (
    <footer className="w-full py-12 sm:py-16 border-t border-white/5">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        {/* Top row: Paragraph */}
        <div className="mb-10">
          <p className="text-grey text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl font-light">
            We, as a community of engineers, affirm privacy as an inherent right of every individual. 
            In all our work, we uphold a duty of clarity, restraint, and respect for personal information. 
            We establish systems that limit exposure, preserve autonomy, and avoid any practice that compromises 
            the dignity or security of the user. These principles stand as the foundation upon which all our 
            efforts are carried out.
          </p>
        </div>

        {/* Bottom row: 3 columns - 1fr 1fr on mobile, 1fr 1fr 1fr on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-10 lg:mb-12">
          {/* Explore Column */}
          <div>
            <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">Explore</h4>
            <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
              <li>
                <button onClick={() => onModalOpen('how-it-works')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaPlay className="text-sky text-xs sm:text-sm" /> How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onModalOpen('features')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaShieldAlt className="text-sky text-xs sm:text-sm" /> Features
                </button>
              </li>
              <li>
                <button onClick={() => onModalOpen('security')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaLock className="text-sky text-xs sm:text-sm" /> Security
                </button>
              </li>
              <li>
                <button onClick={() => onModalOpen('careers')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaBriefcase className="text-sky text-xs sm:text-sm" /> Careers
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">Legal</h4>
            <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
              <li>
                <button onClick={() => onModalOpen('privacy')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaShieldAlt className="text-sky text-xs sm:text-sm" /> Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onModalOpen('terms')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaBan className="text-sky text-xs sm:text-sm" /> Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onModalOpen('disclaimer')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaDatabase className="text-sky text-xs sm:text-sm" /> Disclaimer
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">Contact</h4>
            <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
              <li>
                <button onClick={() => onModalOpen('contact')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaEnvelope className="text-sky text-xs sm:text-sm" /> Email
                </button>
              </li>
              <li>
                <button onClick={() => onModalOpen('contact')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaInstagram className="text-sky text-xs sm:text-sm" /> Instagram
                </button>
              </li>
              <li>
                <button onClick={() => onModalOpen('contact')} className="footer-link text-sm sm:text-base flex items-center gap-2 w-full text-left">
                  <FaFacebook className="text-sky text-xs sm:text-sm" /> Facebook
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 sm:pt-8 border-t border-white/5 text-center text-grey text-xs sm:text-sm font-light">
          <p>©2025 Driflly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
