import React from 'react'

const HowToConnect: React.FC = () => {
  return (
    <div className="w-full">
      <h3 className="text-white/50 text-xs font-bold tracking-wide mb-4">HOW TO CONNECT</h3>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky/20">
            <span className="text-sky text-xs font-black">1</span>
          </div>
          <div>
            <h4 className="text-white text-sm font-bold mb-0.5">Share the link</h4>
            <p className="text-grey text-xs font-light leading-relaxed">Send the link above. Opens directly in browser.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky/20">
            <span className="text-sky text-xs font-black">2</span>
          </div>
          <div>
            <h4 className="text-white text-sm font-bold mb-0.5">Scan QR code</h4>
            <p className="text-grey text-xs font-light leading-relaxed">Quick connect for mobile users.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky/20">
            <span className="text-sky text-xs font-black">3</span>
          </div>
          <div>
            <h4 className="text-white text-sm font-bold mb-0.5">Enter 6-digit code</h4>
            <p className="text-grey text-xs font-light leading-relaxed">Alternative for voice/phone sharing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToConnect;
