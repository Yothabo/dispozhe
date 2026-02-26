import React from 'react';
import { FaBriefcase, FaCode, FaShieldAlt, FaUsers } from 'react-icons/fa';

const CareersContent: React.FC = () => {
  return (
    <div className="text-grey space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-sky/10 flex items-center justify-center mx-auto mb-4 border border-sky/20">
          <FaBriefcase className="text-sky text-3xl" />
        </div>
        <h3 className="text-white text-xl font-bold mb-2">Join Our Team</h3>
        <p className="text-grey text-sm">
          Help us build the future of private communication.
        </p>
      </div>

      <div className="space-y-4">
        <div className="glass rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky/10 flex items-center justify-center">
              <FaCode className="text-sky text-lg" />
            </div>
            <div>
              <h4 className="text-white font-bold">Senior Frontend Engineer</h4>
              <p className="text-xs text-grey/70">Remote · Full-time</p>
            </div>
          </div>
          <p className="text-sm text-grey mb-3">
            Build elegant, responsive interfaces for our ephemeral chat platform.
          </p>
          <button className="text-xs text-sky hover:underline">Apply →</button>
        </div>

        <div className="glass rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky/10 flex items-center justify-center">
              <FaShieldAlt className="text-sky text-lg" />
            </div>
            <div>
              <h4 className="text-white font-bold">Security Engineer</h4>
              <p className="text-xs text-grey/70">Remote · Full-time</p>
            </div>
          </div>
          <p className="text-sm text-grey mb-3">
            Audit and harden our encryption protocols and infrastructure.
          </p>
          <button className="text-xs text-sky hover:underline">Apply →</button>
        </div>

        <div className="glass rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky/10 flex items-center justify-center">
              <FaUsers className="text-sky text-lg" />
            </div>
            <div>
              <h4 className="text-white font-bold">Developer Advocate</h4>
              <p className="text-xs text-grey/70">Remote · Full-time</p>
            </div>
          </div>
          <p className="text-sm text-grey mb-3">
            Champion privacy-first development and grow our community.
          </p>
          <button className="text-xs text-sky hover:underline">Apply →</button>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-4 text-center mt-6">
        <p className="text-xs text-grey/70">
          Don't see a role that fits? Send your resume to <span className="text-sky">careers@driflly.com</span>
        </p>
      </div>
    </div>
  );
};

export default CareersContent;
