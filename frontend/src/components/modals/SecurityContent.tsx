import React from 'react';

const SecurityContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        Chatlly's security architecture is designed to protect user privacy.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Encryption Protocol</h4>
        <p className="text-sm leading-relaxed">
          AES-256-GCM encryption is applied to all messages. Keys are generated and stored exclusively on user devices.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Data Retention</h4>
        <p className="text-sm leading-relaxed">
          Session metadata is stored temporarily in memory and permanently deleted upon session expiration or termination. No message content is stored.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Access Security</h4>
        <p className="text-sm leading-relaxed">
          Room access is secured through one-time links and codes that expire after use. Users are responsible for secure transmission of access methods.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Open Source</h4>
        <p className="text-sm leading-relaxed">
          The Chatlly codebase is open source and available for independent security auditing.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">Security Limitations</h4>
        <p className="text-sm leading-relaxed">
          While industry-standard security measures are implemented, no internet-based service can guarantee absolute security. Users should exercise appropriate caution.
        </p>
      </div>
    </div>
  );
};

export default SecurityContent;
