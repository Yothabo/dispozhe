import React from 'react';

const DisclaimerContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        Please read this disclaimer carefully before using Chatlly.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">1. No Endorsement</h4>
        <p className="text-sm leading-relaxed">
          Chatlly provides a platform for private communication. We do not endorse or guarantee the accuracy or reliability of any content transmitted through the service.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">2. No Records</h4>
        <p className="text-sm leading-relaxed">
          Chatlly does not maintain records of conversations. Upon session expiration or termination, all associated data is permanently deleted and cannot be retrieved.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">3. No User Control</h4>
        <p className="text-sm leading-relaxed">
          Chatlly does not verify user identities or control user behavior. Users are advised to exercise judgment when communicating with others.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">4. No Warranty</h4>
        <p className="text-sm leading-relaxed">
          The service is provided on an "as is" and "as available" basis without warranties of any kind.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">5. Limitation of Liability</h4>
        <p className="text-sm leading-relaxed">
          Chatlly shall not be liable for damages arising out of or in connection with use of the service.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">6. Legal Compliance</h4>
        <p className="text-sm leading-relaxed">
          Users are responsible for complying with applicable laws in their jurisdiction regarding online communication.
        </p>
      </div>
    </div>
  );
};

export default DisclaimerContent;
