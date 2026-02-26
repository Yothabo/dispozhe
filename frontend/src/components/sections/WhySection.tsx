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
              Persistent chat histories create risk. Every message stored is a message that can be leaked, subpoenaed, or exposed. Driflly is designed for conversations that do not leave a record — not because the content is sensitive, but because permanence is not always necessary or desirable.
            </p>
            <p className="text-grey text-base sm:text-lg leading-relaxed font-light">
              The system retains no data. Session metadata exists only in memory while a chat is active and is purged upon termination. No backups. No logs. No recovery.
            </p>
            <p className="text-grey text-base sm:text-lg leading-relaxed font-light">
              This is not a feature added for compliance. It is the foundational design principle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySection;
