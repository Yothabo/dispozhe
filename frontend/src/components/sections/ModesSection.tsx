import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserFriends, FaUsers, FaChalkboardTeacher, FaBroadcastTower, FaFileDownload, FaCommentSlash } from 'react-icons/fa';

const ModesSection: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const modes = useMemo(() => [
    {
      id: 'duo',
      name: 'Duo',
      icon: FaUserFriends,
      description: 'Private two-person ephemeral chats',
      features: ['One-time access', 'Auto or manual destruction', 'End-to-end encrypted'],
      available: true,
      action: () => navigate('/create')
    },
    {
      id: 'group',
      name: 'Group',
      icon: FaUsers,
      description: 'Small multi-participant sessions',
      features: ['Anonymous handles', 'Configurable participant caps', 'Temporary moderator roles'],
      available: false
    },
    {
      id: 'liveboard',
      name: 'Live Board',
      icon: FaChalkboardTeacher,
      description: 'Classroom and meeting engagement',
      features: ['Host creates room with display code', 'Anonymous participant messages', 'Message queue on host screen'],
      available: false
    },
    {
      id: 'broadcast',
      name: 'Broadcast',
      icon: FaBroadcastTower,
      description: 'One-to-many ephemeral announcements',
      features: ['Host-only messaging', 'Anonymous participant reactions', 'Auto-clear after stream ends'],
      available: false
    },
    {
      id: 'drop',
      name: 'Drop',
      icon: FaFileDownload,
      description: 'Ephemeral file and text transfer',
      features: ['Self-destructs when opened', 'For sensitive documents', 'No server retention'],
      available: false
    },
    {
      id: 'whisper',
      name: 'Whisper',
      icon: FaCommentSlash,
      description: 'Micro-messages that disappear after reading',
      features: ['No logs', 'No identity', 'Configurable read timers'],
      available: false
    }
  ], [navigate]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll carousel on mobile
  useEffect(() => {
    if (!isMobile) return;

    const startAutoplay = () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      autoplayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % modes.length);
      }, 4000); // Change slide every 4 seconds
    };

    startAutoplay();

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [isMobile, modes.length]);

  // Pause autoplay on user interaction
  const pauseAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  // Resume autoplay after user stops interacting
  const resumeAutoplay = () => {
    if (!isMobile) return;

    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % modes.length);
    }, 4000);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    pauseAutoplay();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      resumeAutoplay();
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % modes.length);
    }
    if (isRightSwipe) {
      setCurrentIndex((prev) => (prev - 1 + modes.length) % modes.length);
    }

    // Resume autoplay after a short delay
    setTimeout(resumeAutoplay, 500);
  };

  const goToSlide = (index: number) => {
    pauseAutoplay();
    setCurrentIndex(index);
    setTimeout(resumeAutoplay, 2000); // Resume after 2 seconds of inactivity
  };

  return (
    <section className="w-full py-16 sm:py-20 lg:py-28 bg-navy-light/20 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-4 sm:mb-6">
            Choose your mode
          </h2>
          <p className="text-base sm:text-xl text-grey-light max-w-3xl mx-auto leading-relaxed font-light">
            Six ways to communicate privately. Each mode is ephemeral, encrypted, and anonymous by design.
          </p>
        </div>

        {/* Mobile Carousel with Swipe */}
        {isMobile ? (
          <div className="relative md:hidden">
            <div
              ref={carouselRef}
              className="overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <div
                      key={mode.id}
                      className="w-full flex-shrink-0 px-4"
                    >
                      <div
                        className={`glass rounded-2xl p-6 border ${
                          mode.available ? 'border-sky/20' : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            mode.available ? 'bg-sky/10' : 'bg-white/5'
                          }`}>
                            <Icon className={`w-6 h-6 ${mode.available ? 'text-sky' : 'text-grey'}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{mode.name}</h3>
                          </div>
                        </div>

                        <p className="text-grey text-sm mb-4">{mode.description}</p>

                        <ul className="space-y-2 mb-6">
                          {mode.features.map((feature, idx) => (
                            <li key={idx} className="text-xs text-grey/70 flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-sky/50"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>

                        {mode.available ? (
                          <button
                            onClick={mode.action}
                            className="w-full py-3 bg-sky text-navy rounded-xl font-medium hover:bg-sky-dark transition-colors text-sm"
                          >
                            Start chat
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-3 bg-white/5 text-grey/50 rounded-xl font-medium cursor-not-allowed text-sm border border-white/5"
                          >
                            Coming soon
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {modes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-6 bg-sky' : 'bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Desktop Grid */
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className={`glass rounded-2xl p-6 border ${
                    mode.available ? 'border-sky/20' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      mode.available ? 'bg-sky/10' : 'bg-white/5'
                    }`}>
                      <Icon className={`w-6 h-6 ${mode.available ? 'text-sky' : 'text-grey'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{mode.name}</h3>
                    </div>
                  </div>

                  <p className="text-grey text-sm mb-4">{mode.description}</p>

                  <ul className="space-y-2 mb-6">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-grey/70 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-sky/50"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {mode.available ? (
                    <button
                      onClick={mode.action}
                      className="w-full py-3 bg-sky text-navy rounded-xl font-medium hover:bg-sky-dark transition-colors text-sm"
                    >
                      Start chat
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 bg-white/5 text-grey/50 rounded-xl font-medium cursor-not-allowed text-sm border border-white/5"
                    >
                      Coming soon
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8 sm:mt-12">
          <p className="text-xs text-grey/50">
            All modes are ephemeral by design. No data stored. No identity required.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ModesSection;
