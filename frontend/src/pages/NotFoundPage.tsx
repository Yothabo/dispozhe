import React from 'react';
import { useNavigate } from 'react-router-dom';
import Background from '../components/Background';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-sky/10 flex items-center justify-center mx-auto mb-6 border border-sky/20">
            <span className="text-sky text-4xl">404</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
          <p className="text-grey mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
