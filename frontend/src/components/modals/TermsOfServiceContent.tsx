import React from 'react';

const TermsOfServiceContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <p className="text-sm leading-relaxed">
        By accessing or using Chatlly, you agree to these Terms of Service.
      </p>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">1. Service Description</h4>
        <p className="text-sm leading-relaxed">
          Chatlly provides ephemeral, encrypted messaging rooms that expire after a predetermined time or upon manual termination. The service is provided "as is" without warranties.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">2. User Responsibility</h4>
        <p className="text-sm leading-relaxed">
          Users are responsible for the content they transmit through Chatlly. The service may not be used for unlawful purposes or to transmit material that violates applicable laws.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">3. Content Liability</h4>
        <p className="text-sm leading-relaxed">
          Chatlly does not moderate or monitor user communications. The service is not responsible for the content, accuracy, or nature of messages exchanged.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">4. Limitation of Liability</h4>
        <p className="text-sm leading-relaxed">
          To the extent permitted by law, Chatlly and its operators shall not be liable for damages arising from or related to use of the service.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">5. Service Availability</h4>
        <p className="text-sm leading-relaxed">
          While we strive to maintain service availability, uninterrupted access is not guaranteed. The service may be temporarily unavailable due to maintenance or technical issues.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">6. Termination</h4>
        <p className="text-sm leading-relaxed">
          Access to the service may be terminated or suspended without prior notice for violation of these Terms.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-white font-semibold">7. Governing Law</h4>
        <p className="text-sm leading-relaxed">
          These Terms shall be governed by the laws of the Republic of South Africa.
        </p>
      </div>
      <p className="text-xs text-grey/50 mt-8">
        Last updated: February 2025
      </p>
    </div>
  );
};

export default TermsOfServiceContent;
