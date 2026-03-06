import React from 'react';

const HowItWorksContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        Driflly enables private communication through a four-step process designed to leave no persistent record.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">1. Session creation</h4>
        <p className="text-sm leading-relaxed">
          A user initiates a chat by selecting a duration. An encryption key is generated locally on the user&apos;s device. The key is never transmitted to servers.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">2. Access distribution</h4>
        <p className="text-sm leading-relaxed">
          The session can be accessed via a unique link, QR code, or six-digit code. These access methods expire after first use.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">3. Communication</h4>
        <p className="text-sm leading-relaxed">
          When both participants have joined, an end-to-end encrypted tunnel is established. The server relays encrypted data without accessing plaintext.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">4. Session termination</h4>
        <p className="text-sm leading-relaxed">
          Sessions terminate when the timer expires or when terminated manually by either participant. Upon termination, all session data is permanently deleted from memory.
        </p>
      </div>
    </div>
  );
};

export default HowItWorksContent;
