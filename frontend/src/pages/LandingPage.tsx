import React, { useState } from 'react';
import {
  FaBolt,
  FaPlay,
  FaShieldAlt,
  FaHourglassHalf,
  FaUserSecret,
  FaPlus,
  FaShare,
  FaLock,
  FaTrash,
  FaBan,
  FaCheckCircle,
  FaGlobe,
  FaCommentDots,
  FaKey,
  FaClock,
  FaUserFriends,
  FaDatabase,
  FaQrcode,
  FaDollarSign
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Sections
import CareersContent from '../components/modals/CareersContent';
import ContactContent from '../components/modals/ContactContent';
import DisclaimerContent from '../components/modals/DisclaimerContent';
import FeaturesContent from '../components/modals/FeaturesContent';
import HowItWorksContent from '../components/modals/HowItWorksContent';
import LegalModal from '../components/modals/LegalModal';
import PrivacyPolicyContent from '../components/modals/PrivacyPolicyContent';
import SecurityContent from '../components/modals/SecurityContent';
import TermsOfServiceContent from '../components/modals/TermsOfServiceContent';
import ModesContent from '../components/modals/ModesContent';
import FeaturesSection from '../components/sections/FeaturesSection';
import HeroSection from '../components/sections/HeroSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import WhySection from '../components/sections/WhySection';
import SecuritySection from '../components/sections/SecuritySection';
import ImageSection from '../components/sections/ImageSection';
// import CTASection from '../components/sections/CTASection'; // Disabled
import Footer from '../components/sections/Footer';

// Modals

interface LandingPageProps {
  onStartChat: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChat }) => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'disclaimer' | 'how-it-works' | 'features' | 'security' | 'modes' | 'contact' | 'careers' | null>(null);

  return (
    <div className="min-h-screen w-full">
      <HeroSection onStartChat={onStartChat} />
      <FeaturesSection />
      <HowItWorksSection />
      <WhySection />
      <SecuritySection />
      <ImageSection />
      {/* CTA Section disabled */}
      <Footer onModalOpen={setActiveModal} />

      {/* Modals */}
      <LegalModal isOpen={activeModal === 'privacy'} onClose={() => setActiveModal(null)} title="Privacy Policy" content={<PrivacyPolicyContent />} />
      <LegalModal isOpen={activeModal === 'terms'} onClose={() => setActiveModal(null)} title="Terms of Service" content={<TermsOfServiceContent />} />
      <LegalModal isOpen={activeModal === 'disclaimer'} onClose={() => setActiveModal(null)} title="Disclaimer" content={<DisclaimerContent />} />
      <LegalModal isOpen={activeModal === 'how-it-works'} onClose={() => setActiveModal(null)} title="How It Works" content={<HowItWorksContent />} />
      <LegalModal isOpen={activeModal === 'features'} onClose={() => setActiveModal(null)} title="Features" content={<FeaturesContent />} />
      <LegalModal isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)} title="Security" content={<SecurityContent />} />
      <LegalModal isOpen={activeModal === 'modes'} onClose={() => setActiveModal(null)} title="Modes" content={<ModesContent />} />
      <LegalModal isOpen={activeModal === 'contact'} onClose={() => setActiveModal(null)} title="Contact Us" content={<ContactContent />} />
      <LegalModal isOpen={activeModal === 'careers'} onClose={() => setActiveModal(null)} title="Careers" content={<CareersContent />} />
    </div>
  );
};

export default LandingPage;
