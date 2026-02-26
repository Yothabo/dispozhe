import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

interface CTASectionProps {
  onStartChat: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onStartChat }) => {
  return (
    <section className="w-full py-16 sm:py-20 lg:py-28">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="bg-gradient-to-br from-sky/10 to-sky/5 rounded-3xl border border-sky/20 p-8 sm:p-12 lg:p-16 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Huge logo */}
            <div className="flex justify-center mb-8">
              <img 
                src="/driflly.png" 
                alt="Driflly logo" 
                className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 object-contain"
              />
            </div>
            
            <button onClick={onStartChat} className="btn-primary mx-auto w-full sm:w-auto justify-center text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-10 xl:px-12 py-3 sm:py-4">
              <FaShieldAlt className="mr-2" />
              Start an Ephemeral Chat
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
