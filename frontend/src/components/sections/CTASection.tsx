import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

interface CTASectionProps {
  onStartChat: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onStartChat }) => {
  return (
    <section className="w-full py-16 sm:py-20 lg:py-28">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo above heading with more space */}
          <div className="flex justify-center mb-8">
            <img 
              src="/driflly.png" 
              alt="Driflly logo" 
              className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-contain"
            />
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-4 sm:mb-6">
            Ready to disappear?
          </h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-grey-light mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Conversations should be events, not records.
          </p>
          <button onClick={onStartChat} className="btn-primary mx-auto w-full sm:w-auto justify-center text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-10 xl:px-12 py-3 sm:py-4">
            <FaShieldAlt className="mr-2" />
            Start an Ephemeral Chat
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
