import React from 'react';
import { FaPlus, FaShare, FaLock, FaTrash } from 'react-icons/fa';

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full py-16 sm:py-20 lg:py-28 bg-navy-light/20">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-4 sm:mb-6">
            How <span className="text-gradient">ephemeral</span> chat works
          </h2>
          <p className="text-base sm:text-xl text-grey-light max-w-3xl mx-auto leading-relaxed font-light">
            The platform is designed to facilitate private communication without storing any conversation data.
          </p>
        </div>
        <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 grid grid-cols-[auto,1fr,auto] gap-3 sm:gap-4 lg:gap-8 items-start w-full">
            <div className="step-number text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">01</div>
            <div className="step-content">
              <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white mb-1 sm:mb-2">Session creation</h3>
              <p className="text-grey text-xs sm:text-sm lg:text-base leading-relaxed font-light">
                Users initiate a chat by selecting a duration. An encryption key is generated locally on the user's device and is never transmitted to servers.
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-sky/10 flex items-center justify-center">
              <FaPlus className="text-sky text-sm sm:text-base lg:text-lg" />
            </div>
          </div>
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 grid grid-cols-[auto,1fr,auto] gap-3 sm:gap-4 lg:gap-8 items-start w-full">
            <div className="step-number text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">02</div>
            <div className="step-content">
              <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white mb-1 sm:mb-2">Access distribution</h3>
              <p className="text-grey text-xs sm:text-sm lg:text-base leading-relaxed font-light">
                Sessions can be accessed through one-time links, QR codes, or six-digit codes. These access methods expire immediately after first use.
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-sky/10 flex items-center justify-center">
              <FaShare className="text-sky text-sm sm:text-base lg:text-lg" />
            </div>
          </div>
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 grid grid-cols-[auto,1fr,auto] gap-3 sm:gap-4 lg:gap-8 items-start w-full">
            <div className="step-number text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">03</div>
            <div className="step-content">
              <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white mb-1 sm:mb-2">Encrypted communication</h3>
              <p className="text-grey text-xs sm:text-sm lg:text-base leading-relaxed font-light">
                Once both participants have joined, an end-to-end encrypted tunnel is established. The server relays encrypted data without accessing plaintext.
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-sky/10 flex items-center justify-center">
              <FaLock className="text-sky text-sm sm:text-base lg:text-lg" />
            </div>
          </div>
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 grid grid-cols-[auto,1fr,auto] gap-3 sm:gap-4 lg:gap-8 items-start w-full">
            <div className="step-number text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">04</div>
            <div className="step-content">
              <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white mb-1 sm:mb-2">Session termination</h3>
              <p className="text-grey text-xs sm:text-sm lg:text-base leading-relaxed font-light">
                Sessions terminate automatically when the configured duration expires or can be terminated manually by either participant. All session data is permanently deleted.
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-sky/10 flex items-center justify-center">
              <FaTrash className="text-sky text-sm sm:text-base lg:text-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
