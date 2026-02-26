import React from 'react';

const HowItWorksContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        Driflly enables private, ephemeral communication through a simple four-step process.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">1. Room Creation</h4>
        <p className="text-sm leading-relaxed">
          Users initiate a chat by selecting a duration. An encryption key is generated locally on the user's device.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">2. Access Methods</h4>
        <p className="text-sm leading-relaxed">
          Rooms can be accessed via a unique link, QR code, or six-digit code. These access methods expire after first use.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">3. Communication</h4>
        <p className="text-sm leading-relaxed">
          Once both participants have joined, an end-to-end encrypted tunnel is established. The server relays encrypted data without accessing plaintext.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">4. Session Termination</h4>
        <p className="text-sm leading-relaxed">
          Sessions terminate automatically when the timer expires or can be terminated manually by either participant. Upon termination, all session data is permanently deleted.
        </p>
      </div>
    </div>
  );
};

export default HowItWorksContent;
