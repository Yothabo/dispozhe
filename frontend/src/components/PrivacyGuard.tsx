import React, { useEffect, useState } from 'react';

interface PrivacyGuardProps {
  enabled: boolean;
  children: React.ReactNode;
}

const PrivacyGuard: React.FC<PrivacyGuardProps> = ({
  enabled,
  children
}) => {
  const [showWatermark, setShowWatermark] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Add watermark on visibility change (screenshot attempt heuristic)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowWatermark(true);
      } else {
        // Keep watermark for a moment when returning
        setTimeout(() => setShowWatermark(false), 1000);
      }
    };

    // Detect potential screenshot attempts (blur + return)
    let blurTime = 0;
    const handleBlur = () => {
      blurTime = Date.now();
      setShowWatermark(true);
    };

    const handleFocus = () => {
      // If focus returns quickly, could be screenshot
      if (Date.now() - blurTime < 500) {
        // Keep watermark visible longer
        setTimeout(() => setShowWatermark(false), 2000);
      } else {
        setTimeout(() => setShowWatermark(false), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled]);

  return (
    <div className="relative">
      {children}
      
      {/* Semi-transparent overlay that appears on blur/visibility change */}
      {showWatermark && enabled && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-[2px]" />
          
          {/* Watermark pattern */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Repeating watermark text */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-sky/10 text-4xl font-black whitespace-nowrap transform -rotate-45"
                    style={{
                      top: `${i * 15}%`,
                      left: `${i * 10}%`,
                      transform: `rotate(-45deg) translateX(-50%)`,
                      fontSize: 'clamp(2rem, 8vw, 6rem)'
                    }}
                  >
                    PRIVATE • DRIFLLY • PRIVATE • DRIFLLY
                  </div>
                ))}
              </div>
              
              {/* Center message */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-navy/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-sky/20">
                  <p className="text-sky text-xl font-bold">🔒 Screen protected</p>
                  <p className="text-grey text-sm mt-1">Content is private</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyGuard;
