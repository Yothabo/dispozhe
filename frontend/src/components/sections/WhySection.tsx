import React from 'react';

const WhySection: React.FC = () => {
  return (
    <section id="why" className="w-full py-16 sm:py-20 lg:py-28">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-6 sm:mb-8">
            Why ephemeral
          </h2>
          <div className="space-y-6 text-left">
            <p className="text-grey text-base sm:text-lg leading-relaxed font-light">
              The retention of persistent chat histories introduces inherent risks, as each stored message presents a potential vulnerability to leakage, subpoena, or unauthorized exposure. Driflly has been specifically engineered to facilitate ephemeral conversations, not due to the sensitive nature of the content, but rather because permanent record-keeping is often neither essential nor advantageous.
            </p>
            <p className="text-grey text-base sm:text-lg leading-relaxed font-light">
              Our system is designed to retain no data. Session metadata is exclusively held in memory during an active chat and is systematically purged upon session termination. This architecture precludes the existence of backups, logs, or recovery mechanisms.
            </p>
            <p className="text-grey text-base sm:text-lg leading-relaxed font-light">
              This design is not merely a compliance feature; it represents a fundamental principle embedded in the core architecture of our system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySection;
