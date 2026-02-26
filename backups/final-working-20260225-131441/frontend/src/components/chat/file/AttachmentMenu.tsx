import React, { useEffect, useState } from 'react';
import { 
  FaImage, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFilePowerpoint, 
  FaFileArchive, 
  FaFileAudio, 
  FaFileVideo, 
  FaFileCode,
  FaTimes 
} from 'react-icons/fa';

interface AttachmentMenuProps {
  onSelectImage: () => void;
  onSelectPDF?: () => void;
  onSelectWord?: () => void;
  onSelectExcel?: () => void;
  onSelectPowerpoint?: () => void;
  onSelectArchive?: () => void;
  onSelectAudio?: () => void;
  onSelectVideo?: () => void;
  onSelectCode?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  onSelectImage,
  onSelectPDF = () => {},
  onSelectWord = () => {},
  onSelectExcel = () => {},
  onSelectPowerpoint = () => {},
  onSelectArchive = () => {},
  onSelectAudio = () => {},
  onSelectVideo = () => {},
  onSelectCode = () => {},
  onClose,
  isOpen
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center pb-20"
      style={{ 
        backgroundColor: isVisible ? 'rgba(10, 25, 47, 0.8)' : 'transparent',
        transition: 'background-color 0.3s ease'
      }}
      onClick={onClose}
    >
      <div 
        className="glass rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl transition-all duration-300 ease-out"
        style={{ 
          transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
          opacity: isVisible ? 1 : 0,
          margin: '1rem'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">Attach file</h3>
          <button onClick={onClose} className="text-grey hover:text-white transition-colors">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Only Image is active */}
          <button
            onClick={onSelectImage}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-sky/10 transition-all duration-200 border border-white/10 hover:border-sky/20 hover:scale-105"
          >
            <FaImage className="w-7 h-7 text-sky" />
            <span className="text-white text-xs">Image</span>
          </button>
          
          {/* PDF - greyed out */}
          <button
            onClick={onSelectPDF}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl cursor-not-allowed opacity-50 border border-white/5"
            disabled
          >
            <FaFilePdf className="w-7 h-7 text-grey" />
            <span className="text-grey text-xs">PDF</span>
          </button>
          
          {/* Word - greyed out */}
          <button
            onClick={onSelectWord}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl cursor-not-allowed opacity-50 border border-white/5"
            disabled
          >
            <FaFileWord className="w-7 h-7 text-grey" />
            <span className="text-grey text-xs">Word</span>
          </button>

          {/* All other options - greyed out */}
          <button
            onClick={onSelectExcel}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl cursor-not-allowed opacity-50 border border-white/5"
            disabled
          >
            <FaFileExcel className="w-7 h-7 text-grey" />
            <span className="text-grey text-xs">Excel</span>
          </button>
          
          <button
            onClick={onSelectPowerpoint}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl cursor-not-allowed opacity-50 border border-white/5"
            disabled
          >
            <FaFilePowerpoint className="w-7 h-7 text-grey" />
            <span className="text-grey text-xs">PPT</span>
          </button>
          
          <button
            onClick={onSelectArchive}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl cursor-not-allowed opacity-50 border border-white/5"
            disabled
          >
            <FaFileArchive className="w-7 h-7 text-grey" />
            <span className="text-grey text-xs">Archive</span>
          </button>
          
          <button
            onClick={onSelectAudio}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl cursor-not-allowed opacity-50 border border-white/5"
            disabled
          >
            <FaFileAudio className="w-7 h-7 text-grey" />
            <span className="text-grey text-xs">Audio</span>
          </button>
          
          <button
            onClick={onSelectVideo}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl cursor-not-allowed opacity-50 border border-white/5"
            disabled
          >
            <FaFileVideo className="w-7 h-7 text-grey" />
            <span className="text-grey text-xs">Video</span>
          </button>
          
          <button
            onClick={onSelectCode}
            className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl cursor-not-allowed opacity-50 border border-white/5"
            disabled
          >
            <FaFileCode className="w-7 h-7 text-grey" />
            <span className="text-grey text-xs">Code</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-grey/50 text-xs">
            More file types coming soon • Maximum file size: 10MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttachmentMenu;
