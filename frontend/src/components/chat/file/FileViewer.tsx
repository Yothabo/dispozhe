import React, { useEffect, useState } from 'react';
import { FaTimes, FaDownload, FaEye } from 'react-icons/fa';

import { FileMessage } from '../types';

interface FileViewerProps {
  file: FileMessage;
  onClose: () => void;
  onViewed: (fileId: string) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose, onViewed }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.viewed) {
      onViewed(file.id);
    }

    if (file.type.startsWith('image/') && file.data) {
      const base64Url = `data:${file.type};base64,${file.data}`;
      setImageUrl(base64Url);
    }
  }, [file, onViewed]);

  const handleDownload = () => {};

  const truncateFileName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop() || '';
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - 3 - extension.length);
    return `${truncatedName}...${extension}`;
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const renderContent = () => {
    if (file.type.startsWith('image/')) {
      return imageUrl ? (
        <div className="flex items-center justify-center p-2">
          <img
            src={imageUrl}
            alt={file.name}
            className="max-w-full max-h-[60vh] w-auto h-auto object-contain rounded-lg"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <FaEye className="w-12 h-12 text-grey animate-pulse" />
        </div>
      );
    } else if (file.type === 'application/pdf') {
      return (
        <iframe
          src={`data:application/pdf;base64,${file.data}`}
          title={file.name}
          className="w-full h-[60vh] rounded-lg"
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <FaEye className="w-16 h-16 text-grey" />
          <p className="text-grey text-center px-4 break-all">{truncateFileName(file.name)}</p>
          <p className="text-grey/50 text-sm">
            {file.type} • {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      );
    }
  };

  return (
    <>
      {/* Backdrop - interactive element with role="button" */}
      <div
        className="fixed inset-0 z-40 bg-navy/90 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close file viewer"
      />

      {/* Viewer - non-interactive container */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          className="relative max-w-4xl w-full bg-navy-light rounded-2xl border border-white/10 overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="File viewer"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-white font-bold truncate max-w-md" title={file.name}>
                {truncateFileName(file.name)}
              </h3>
              {file.viewOnce && file.viewed && (
                <span className="text-xs bg-sky/10 text-sky px-2 py-1 rounded-full flex-shrink-0">Viewed once</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="p-2 text-grey/50 cursor-not-allowed"
                title="Download disabled for security"
                disabled
              >
                <FaDownload className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-grey hover:text-white transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-navy/50">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default FileViewer;
