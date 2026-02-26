import React from 'react';

interface MediaErrorMessageProps {
  message: string | null;
}

const MediaErrorMessage: React.FC<MediaErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg z-50">
      {message}
    </div>
  );
};

export default MediaErrorMessage;
