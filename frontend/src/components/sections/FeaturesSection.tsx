import React from 'react';
import { FaHourglassHalf, FaTrash, FaShare, FaUserSecret } from 'react-icons/fa';

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="w-full py-16 sm:py-20 lg:py-28">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-4 sm:mb-6">
            <span className="text-gradient">Ephemeral</span> by design.
          </h2>
          <p className="text-base sm:text-xl text-grey-light max-w-3xl mx-auto leading-relaxed font-light">
            Every message is encrypted end-to-end and permanently deleted upon session termination.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-6">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaHourglassHalf className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Automatic destruction</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              Sessions are configured with a predetermined duration. When the timer expires, all associated data is permanently deleted from our systems.
            </p>
          </div>
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaTrash className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Manual termination</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              Participants may end sessions before timer expiration. Termination immediately deletes all session data and notifies the other participant.
            </p>
          </div>
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaShare className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Multiple access methods</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              Rooms can be accessed via unique links, QR codes, or six-digit codes. All access methods expire after initial use.
            </p>
          </div>
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaUserSecret className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">No identification required</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              The service does not require email addresses, phone numbers, names, or any form of personal identification to create or join conversations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
