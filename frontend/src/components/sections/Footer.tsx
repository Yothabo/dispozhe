import React from 'react';
import { FaPlay, FaShieldAlt, FaLock, FaBan, FaDatabase, FaCommentDots } from 'react-icons/fa';

interface FooterProps {
  onModalOpen: (modal: 'privacy' | 'terms' | 'disclaimer' | 'how-it-works' | 'features' | 'security') => void;
}

const Footer: React.FC<FooterProps> = ({ onModalOpen }) => {
  return (
    <footer className="w-full py-12 sm:py-16 border-t border-white/5">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-10 lg:mb-12">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky to-sky-dark flex items-center justify-center">
                <FaCommentDots className="text-navy text-base sm:text-xl" />
              </div>
              <span className="text-white text-xl sm:text-2xl font-black">Chatlly</span>
            </div>
            <p className="text-grey text-sm sm:text-base lg:text-lg leading-relaxed max-w-md font-light">
              Chatlly provides infrastructure for private, ephemeral communication. We build tools that respect your privacy by design.
            </p>
          </div>
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
            </ul>
          </div>
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
        </div>
        <div className="pt-6 sm:pt-8 border-t border-white/5 text-center text-grey text-xs sm:text-sm font-light">
          <p>©2025 Chatlly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
