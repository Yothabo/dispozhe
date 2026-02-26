import React from 'react';

const PrivacyPolicyContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        Driflly is designed to avoid collecting or storing personal data. This policy outlines data practices.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">1. Data collection</h4>
        <p className="text-sm leading-relaxed">
          Driflly does not collect personally identifiable information. Session identifiers are randomly generated and stored temporarily in memory for the duration of the active session.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">2. Message content</h4>
        <p className="text-sm leading-relaxed">
          Messages are encrypted end-to-end using AES-256-GCM. Encryption keys are generated on users' devices and are not transmitted to or stored on servers. The server relays encrypted data without access to plaintext.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">3. Session data</h4>
        <p className="text-sm leading-relaxed">
          Session metadata (timestamps, participant count) is stored temporarily in memory and is deleted upon session expiration or termination. No historical data is retained.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">4. Third-party sharing</h4>
        <p className="text-sm leading-relaxed">
          Driflly does not share data with third parties. No personal information or message content is collected, therefore no data is available for sharing.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">5. Security</h4>
        <p className="text-sm leading-relaxed">
          Industry-standard encryption and security practices are implemented. Users are responsible for securely sharing access links and codes.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">6. Policy updates</h4>
        <p className="text-sm leading-relaxed">
          Updates to this privacy policy will be reflected on this page. Continued use of Driflly constitutes acceptance of the current policy.
        </p>
      </div>
      <p className="text-xs text-grey/50 mt-8">
        Last updated: February 2025
      </p>
    </div>
  );
};

export default PrivacyPolicyContent;
