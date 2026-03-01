import React from 'react';

const ImageSection: React.FC = () => {
  return (
    <section className="w-full py-16 sm:py-20 lg:py-28 bg-navy-light/20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8">
        <div className="relative flex justify-center">
          {/* Glow effects positioned behind the image */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] sm:w-[70%] md:w-[60%] lg:w-[50%] aspect-square bg-sky/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] sm:w-[80%] md:w-[70%] lg:w-[60%] aspect-square bg-sky/20 rounded-full blur-3xl animate-pulse"></div>
          
          {/* The image - responsive sizing */}
          <div className="w-full sm:w-5/6 md:w-4/5 lg:w-3/4 xl:w-2/3 mx-auto">
            <img 
              src="/images/chat-section.png" 
              alt="Driflly Chat Interface" 
              className="w-full h-auto object-contain relative z-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageSection;
