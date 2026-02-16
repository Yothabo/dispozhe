import React from 'react';

const FeaturesContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        Chatlly is designed with privacy as the primary requirement.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Self-Destructing Sessions</h4>
        <p className="text-sm leading-relaxed">
          Rooms are configured with a timer. When the timer expires, the session and all associated data are permanently deleted.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Manual Termination</h4>
        <p className="text-sm leading-relaxed">
          Participants may terminate sessions before timer expiration. Termination immediately deletes all session data.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">End-to-End Encryption</h4>
        <p className="text-sm leading-relaxed">
          All messages are encrypted using AES-256-GCM. Encryption keys remain on participants' devices and are not accessible to the service.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">One-Time Access</h4>
        <p className="text-sm leading-relaxed">
          Rooms are accessed via one-time links, QR codes, or six-digit codes. These access methods expire after initial use.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">No Identity Required</h4>
        <p className="text-sm leading-relaxed">
          Chatlly does not require email addresses, phone numbers, names, or any form of identification to use the service.
        </p>
      </div>
    </div>
  );
};

export default FeaturesContent;
