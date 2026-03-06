import React from 'react';
import { FaHourglassHalf, FaTrash, FaUserSecret, FaLock } from 'react-icons/fa';

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="w-full py-16 sm:py-20 lg:py-28">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-4 sm:mb-6">
            Designed for Privacy.
          </h2>
          <p className="text-base sm:text-xl text-grey-light max-w-3xl mx-auto leading-relaxed font-light">
            Conversations are ephemeral, leaving no digital footprint. No data is retained, and no personal identification is necessary.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4 sm:px-6">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaHourglassHalf className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Session-Based Engagement.</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              Each session is time-bound. Upon expiration, the conversation is permanently concluded.
            </p>
          </div>
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaTrash className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">User-Initiated Termination.</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              Sessions can be proactively ended, resulting in the immediate and irreversible deletion of all associated data. No archives or recovery options are available.
            </p>
          </div>
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaUserSecret className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Anonymity Ensured.</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              No email address, phone number, or name is required. Your participation is based on interaction, not on a personal profile.
            </p>
          </div>
          <div className="w-full sm:col-span-2 lg:col-span-3 lg:max-w-2xl lg:mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <FaLock className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Robust End-to-End Encryption.</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              All messages are encrypted directly on your device, ensuring that the server never accesses unencrypted content.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
