import React from 'react';
import { FaEnvelope, FaInstagram, FaFacebook, FaTools } from 'react-icons/fa';

const ContactContent: React.FC = () => {
  return (
    <div className="text-grey space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-sky/10 flex items-center justify-center mx-auto mb-4 border border-sky/20">
          <FaTools className="text-sky text-3xl" />
        </div>
        <h3 className="text-white text-xl font-bold mb-2">Under Maintenance</h3>
        <p className="text-grey text-sm">
          Our social channels are currently being set up. We'll be here soon!
        </p>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h4 className="text-white font-semibold mb-4">Contact Information</h4>
        <ul className="space-y-4">
          <li className="flex items-center gap-3 text-grey">
            <div className="w-8 h-8 rounded-lg bg-sky/10 flex items-center justify-center">
              <FaEnvelope className="text-sky" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Email</p>
              <p className="text-xs text-grey/50">contact@driflly.app</p>
            </div>
          </li>
          <li className="flex items-center gap-3 text-grey">
            <div className="w-8 h-8 rounded-lg bg-sky/10 flex items-center justify-center">
              <FaInstagram className="text-sky" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Instagram</p>
              <p className="text-xs text-grey/50">@driflly.app</p>
            </div>
          </li>
          <li className="flex items-center gap-3 text-grey">
            <div className="w-8 h-8 rounded-lg bg-sky/10 flex items-center justify-center">
              <FaFacebook className="text-sky" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Facebook</p>
              <p className="text-xs text-grey/50">/driflly.app</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-white/5 rounded-lg p-4 text-center">
        <p className="text-xs text-grey/70">
          In the meantime, you can reach us at <span className="text-sky">contact@driflly.app</span>
        </p>
      </div>
    </div>
  );
};

export default ContactContent;
