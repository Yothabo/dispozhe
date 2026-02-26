import React from 'react';
import { FaHourglassHalf, FaTrash, FaShare, FaUserSecret } from 'react-icons/fa';

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="w-full py-16 sm:py-20 lg:py-28">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-4 sm:mb-6">
            How ephemeral chat works
          </h2>
          <p className="text-base sm:text-xl text-grey-light max-w-3xl mx-auto leading-relaxed font-light">
            The platform is designed to facilitate private communication without storing any conversation data.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-6">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaHourglassHalf className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Session creation</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              Users initiate a chat by selecting a duration. An encryption key is generated locally on the user's device and is never transmitted to servers.
            </p>
          </div>
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaShare className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Access distribution</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              Sessions can be accessed through one-time links, QR codes, or six-digit codes. These access methods expire immediately after first use.
            </p>
          </div>
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <FaTrash className="w-6 h-6 sm:w-7 sm:h-7 text-sky flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Session termination</h3>
            </div>
            <p className="text-grey text-sm sm:text-base leading-relaxed font-light pl-9">
              Sessions terminate automatically when the configured duration expires or can be terminated manually by either participant. All session data is permanently deleted.
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
