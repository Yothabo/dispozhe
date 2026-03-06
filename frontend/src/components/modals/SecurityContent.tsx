import React from 'react';

const SecurityContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        Driflly&apos;s security architecture is designed to prevent data retention and unauthorized access.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Encryption</h4>
        <p className="text-sm leading-relaxed">
          Messages are encrypted with AES-256-GCM. Keys are generated and stored on participant devices. The server never receives encryption keys.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Data retention</h4>
        <p className="text-sm leading-relaxed">
          Session metadata exists only in memory during active sessions. No message content is stored. Upon termination, all data is permanently deleted.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Access control</h4>
        <p className="text-sm leading-relaxed">
          Room access is secured through one-time links and codes that expire after use. Access methods cannot be reused.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Server architecture</h4>
        <p className="text-sm leading-relaxed">
          The server relays encrypted data between participants. It does not have access to plaintext messages or encryption keys.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Open source</h4>
        <p className="text-sm leading-relaxed">
          The codebase is publicly available. Independent security audits are permitted and encouraged.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Limitations</h4>
        <p className="text-sm leading-relaxed">
          While the system is designed to prevent data retention, participants should be aware that:
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
          <li>Screenshots can be taken by participants</li>
          <li>Devices may cache data outside the application</li>
          <li>Network traffic metadata may be visible to internet service providers</li>
        </ul>
      </div>
    </div>
  );
};

export default SecurityContent;
