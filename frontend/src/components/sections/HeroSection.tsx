import React from 'react';
import { FaClock, FaTrash, FaShieldAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onStartChat: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartChat }) => {
  const navigate = useNavigate();

  return (
    <section className="w-full min-h-screen flex items-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full lg:w-1/2 h-full opacity-20 lg:opacity-100">
          <img
            src="/images/hero.png"
            alt=""
            className="w-full h-full object-contain object-right"
            aria-hidden="true"
          />
        </div>
        {/* Gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-navy/50 to-navy lg:via-transparent"></div>
      </div>

      {/* Content */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 bg-sky/10 border border-sky/20 px-4 sm:px-5 py-2 rounded-2xl mb-6">
              <span className="w-2 h-2 rounded-full bg-sky animate-pulse"></span>
              <span className="text-sky text-xs sm:text-sm font-medium tracking-wide">END-TO-END ENCRYPTED</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-6">
              <span className="text-sky">Driflly</span>
              <span className="text-white"> — conversations that vanish</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-grey-light mb-8 leading-relaxed font-light max-w-xl">
              Encrypted, ephemeral chat rooms. No data stored. No identity required.
            </p>
            <div className="flex flex-row flex-wrap gap-3 sm:gap-8 mb-10">
              <div className="flex items-center gap-2 text-grey">
                <FaClock className="text-sky text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm font-light">Time-limited</span>
              </div>
              <div className="flex items-center gap-2 text-grey">
                <FaTrash className="text-sky text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm font-light">Manual termination</span>
              </div>
              <div className="flex items-center gap-2 text-grey">
                <FaShieldAlt className="text-sky text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm font-light">Zero data retention</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onStartChat} className="btn-primary w-full sm:w-auto justify-center">
                Start private Duo chat
              </button>
              <button
                onClick={() => navigate('/code')}
                className="btn-secondary w-full sm:w-auto justify-center"
              >
                Join active chat
              </button>
            </div>
            <p className="text-xs text-grey/50 mt-8 font-light">
              Freemium • Ephemeral • Open source
            </p>
          </div>

          {/* Empty div to maintain grid layout */}
          <div className="hidden lg:block"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
