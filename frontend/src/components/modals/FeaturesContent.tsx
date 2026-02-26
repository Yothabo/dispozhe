import React from 'react';

const FeaturesContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        Driflly provides ephemeral, encrypted communication without persistent storage.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Time-limited sessions</h4>
        <p className="text-sm leading-relaxed">
          Sessions are configured with a duration. When the timer expires, the session and all associated data are permanently deleted from memory.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Manual termination</h4>
        <p className="text-sm leading-relaxed">
          Participants may end sessions before timer expiration. Termination immediately deletes all session data and notifies the other participant.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">End-to-end encryption</h4>
        <p className="text-sm leading-relaxed">
          Messages are encrypted using AES-256-GCM. Encryption keys are generated and stored on participant devices. The server relays encrypted data without access to plaintext.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">One-time access</h4>
        <p className="text-sm leading-relaxed">
          Sessions are accessed via one-time links, QR codes, or six-digit codes. Access methods expire after initial use.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">No identification</h4>
        <p className="text-sm leading-relaxed">
          The service does not require email addresses, phone numbers, names, or any form of personal identification.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Open source</h4>
        <p className="text-sm leading-relaxed">
          The codebase is publicly available for independent security auditing.
        </p>
      </div>
    </div>
  );
};

export default FeaturesContent;
