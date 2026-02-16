import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import SecuritySection from '../components/sections/SecuritySection';
import CTASection from '../components/sections/CTASection';
import Footer from '../components/sections/Footer';
import LegalModal from '../components/modals/LegalModal';
import PrivacyPolicyContent from '../components/modals/PrivacyPolicyContent';
import TermsOfServiceContent from '../components/modals/TermsOfServiceContent';
import DisclaimerContent from '../components/modals/DisclaimerContent';
import HowItWorksContent from '../components/modals/HowItWorksContent';
import FeaturesContent from '../components/modals/FeaturesContent';
import SecurityContent from '../components/modals/SecurityContent';

interface LandingPageProps {
  onStartChat: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChat }) => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'disclaimer' | 'how-it-works' | 'features' | 'security' | null>(null);

  return (
    <div className="min-h-screen w-full">
      <HeroSection onStartChat={onStartChat} />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <CTASection onStartChat={onStartChat} />
      <Footer onModalOpen={setActiveModal} />
      <LegalModal isOpen={activeModal === 'privacy'} onClose={() => setActiveModal(null)} title="Privacy Policy" content={<PrivacyPolicyContent />} />
      <LegalModal isOpen={activeModal === 'terms'} onClose={() => setActiveModal(null)} title="Terms of Service" content={<TermsOfServiceContent />} />
      <LegalModal isOpen={activeModal === 'disclaimer'} onClose={() => setActiveModal(null)} title="Disclaimer" content={<DisclaimerContent />} />
      <LegalModal isOpen={activeModal === 'how-it-works'} onClose={() => setActiveModal(null)} title="How It Works" content={<HowItWorksContent />} />
      <LegalModal isOpen={activeModal === 'features'} onClose={() => setActiveModal(null)} title="Features" content={<FeaturesContent />} />
      <LegalModal isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)} title="Security" content={<SecurityContent />} />
    </div>
  );
};

export default LandingPage;
