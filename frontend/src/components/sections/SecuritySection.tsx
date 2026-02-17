import React from 'react';
import { FaBan, FaCheckCircle } from 'react-icons/fa';

const SecuritySection: React.FC = () => {
  return (
    <section id="security" className="w-full py-16 sm:py-20 lg:py-28">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-4 sm:mb-6">
            <span className="text-gradient">Trust, but verify.</span><br />
            Here's exactly what we do.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 w-full">
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">What we do not do</h3>
            </div>
            <ul className="space-y-3 sm:space-y-4 lg:space-y-5">
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaBan className="text-red-400 text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">Store messages</span>
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaBan className="text-red-400 text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">Read conversations</span>
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaBan className="text-red-400 text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">Request personal information</span>
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaBan className="text-red-400 text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">Retain chat history</span>
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaBan className="text-red-400 text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">Share data with third parties</span>
              </li>
            </ul>
          </div>
          <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 w-full">
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">What we provide</h3>
            </div>
            <ul className="space-y-3 sm:space-y-4 lg:space-y-5">
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaCheckCircle className="text-sky text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">End-to-end AES-256 encryption</span>
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaCheckCircle className="text-sky text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">Client-side key generation</span>
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaCheckCircle className="text-sky text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">One-time access methods</span>
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaCheckCircle className="text-sky text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">Automatic and manual termination</span>
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg text-grey">
                <FaCheckCircle className="text-sky text-base sm:text-lg lg:text-xl flex-shrink-0" />
                <span className="font-light">Open source codebase</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
