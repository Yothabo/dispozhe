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
    console.log('[FileViewer] Opening file:', file.name, file.type);
    
    // Mark as viewed when opened
    if (!file.viewed) {
      console.log('[FileViewer] Marking file as viewed:', file.id);
      onViewed(file.id);
    }

    // Create object URL for images
    if (file.type.startsWith('image/') && file.data) {
      const base64Url = `data:${file.type};base64,${file.data}`;
      setImageUrl(base64Url);
    }
  }, [file, onViewed]);

  const handleDownload = () => {
    if (file.data) {
      const link = document.createElement('a');
      link.href = `data:${file.type};base64,${file.data}`;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (file.type.startsWith('image/')) {
      return imageUrl ? (
        <img 
          src={imageUrl} 
          alt={file.name} 
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
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
          className="w-full h-[70vh] rounded-lg"
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <FaEye className="w-16 h-16 text-grey" />
          <p className="text-grey text-center">{file.name}</p>
          <p className="text-grey/50 text-sm">
            {file.type} • {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/90 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-4xl w-full bg-navy-light rounded-2xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold truncate max-w-md">{file.name}</h3>
            {file.viewOnce && file.viewed && (
              <span className="text-xs bg-sky/10 text-sky px-2 py-1 rounded-full">Viewed once</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-grey hover:text-white transition-colors"
              title="Download"
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
        
        {/* Content */}
        <div className="p-4 bg-navy/50">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
