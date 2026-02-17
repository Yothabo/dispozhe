import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBolt, FaKey, FaClock, FaTrash, FaShieldAlt } from 'react-icons/fa';

interface HeroSectionProps {
  onStartChat: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartChat }) => {
  const navigate = useNavigate();

  return (
    <section className="w-full min-h-screen flex items-center relative overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 bg-sky/10 border border-sky/20 px-4 sm:px-5 py-2 rounded-2xl mb-6">
              <span className="w-2 h-2 rounded-full bg-sky animate-pulse"></span>
              <span className="text-sky text-xs sm:text-sm font-medium tracking-wide">END-TO-END ENCRYPTED</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-6">
              <span className="text-sky">Driflly</span>,{' '}
              <span className="text-white">Conversations that vanish</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-grey-light mb-8 leading-relaxed font-light max-w-xl">
              Chat rooms with no eyes and no ears. They don't watch, record, or store anything. 
              They open when you join, fade when you leave, and nothing follows you out.
            </p>
            <div className="flex flex-row flex-wrap gap-3 sm:gap-8 mb-10">
              <div className="flex items-center gap-2 text-grey">
                <FaClock className="text-sky text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm font-light">Auto-destruct</span>
              </div>
              <div className="flex items-center gap-2 text-grey">
                <FaTrash className="text-sky text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm font-light">Manual</span>
              </div>
              <div className="flex items-center gap-2 text-grey">
                <FaShieldAlt className="text-sky text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm font-light">Zero data</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onStartChat} className="btn-primary w-full sm:w-auto justify-center">
                <FaBolt className="mr-2" />
                Start Private Chat
              </button>
              <button
                onClick={() => navigate('/code')}
                className="btn-secondary w-full sm:w-auto justify-center"
              >
                <FaKey className="mr-2" />
                Enter Code
              </button>
            </div>
            <p className="text-xs text-grey/50 mt-8 font-light">
              Free, ephemeral, open source
            </p>
          </div>
          <div className="lg:block relative">
            <div className="glass rounded-3xl p-8 border border-sky/20">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky/20 flex items-center justify-center">
                    <span className="text-sky text-xs font-bold">A</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl rounded-tl-none p-3">
                      <p className="text-white text-sm">Is anyone listening?</p>
                    </div>
                    <span className="text-grey/50 text-[10px] mt-1 block">2 min left</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-sky flex items-center justify-center">
                    <span className="text-navy text-xs font-bold">B</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-sky/10 rounded-2xl rounded-tr-none p-3 border border-sky/20">
                      <p className="text-sky text-sm">No eyes, no ears. Just us.</p>
                    </div>
                    <span className="text-grey/50 text-[10px] mt-1 block text-right">1 min left</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky/20 flex items-center justify-center">
                    <span className="text-sky text-xs font-bold">A</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl rounded-tl-none p-3">
                      <p className="text-white text-sm">Good. Sharing the link now...</p>
                    </div>
                    <span className="text-grey/50 text-[10px] mt-1 block">30 sec left</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-grey font-light">Chat room ends in</span>
                    <span className="text-sky font-bold">2:34</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                    <div className="w-1/3 h-1 bg-sky rounded-full"></div>
                  </div>
                  <p className="text-grey/50 text-[10px] mt-2 text-center font-light">
                    Fades when you leave. Nothing follows you out.
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-sky/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-sky/5 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
