import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaShieldAlt, FaMobileAlt } from 'react-icons/fa';

interface PrivacySettingsProps {
  onSettingsChange?: (settings: PrivacySettings) => void;
}

interface PrivacySettings {
  blurOnScreenshot: boolean;
  blurOnTabSwitch: boolean;
  blurOnMinimize: boolean;
  disableScreenshots: boolean;
  hideNotifications: boolean;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<PrivacySettings>({
    blurOnScreenshot: true,
    blurOnTabSwitch: true,
    blurOnMinimize: true,
    disableScreenshots: true,
    hideNotifications: false
  });

  const [isOpen, setIsOpen] = useState(false);

  const toggleSetting = (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 p-3 bg-navy-light/80 backdrop-blur-sm rounded-full border border-white/10 hover:border-sky/30 transition-colors shadow-lg"
        title="Privacy settings"
      >
        <FaShieldAlt className="w-5 h-5 text-sky" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-72 glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-navy-light/50">
        <h3 className="text-white font-bold flex items-center gap-2">
          <FaShieldAlt className="text-sky" /> Privacy Guard
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-grey hover:text-white transition-colors"
        >
          <FaEyeSlash className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <label className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer">
          <span className="text-sm text-grey flex items-center gap-2">
            <FaEye className="text-sky/70" /> Blur on screenshot
          </span>
          <input
            type="checkbox"
            checked={settings.blurOnScreenshot}
            onChange={() => toggleSetting('blurOnScreenshot')}
            className="toggle-checkbox"
          />
        </label>

        <label className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer">
          <span className="text-sm text-grey flex items-center gap-2">
            <FaMobileAlt className="text-sky/70" /> Blur on tab switch
          </span>
          <input
            type="checkbox"
            checked={settings.blurOnTabSwitch}
            onChange={() => toggleSetting('blurOnTabSwitch')}
            className="toggle-checkbox"
          />
        </label>

        <label className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer">
          <span className="text-sm text-grey flex items-center gap-2">
            <FaMobileAlt className="text-sky/70" /> Blur on minimize
          </span>
          <input
            type="checkbox"
            checked={settings.blurOnMinimize}
            onChange={() => toggleSetting('blurOnMinimize')}
            className="toggle-checkbox"
          />
        </label>

        <label className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer">
          <span className="text-sm text-grey flex items-center gap-2">
            <FaEyeSlash className="text-sky/70" /> Hide notifications
          </span>
          <input
            type="checkbox"
            checked={settings.hideNotifications}
            onChange={() => toggleSetting('hideNotifications')}
            className="toggle-checkbox"
          />
        </label>
      </div>

      <div className="p-3 border-t border-white/5 bg-navy-light/30">
        <p className="text-[10px] text-grey/50">
          Privacy features work best on supported browsers. Blur activates when app is not in focus.
        </p>
      </div>
    </div>
  );
};

export default PrivacySettings;
