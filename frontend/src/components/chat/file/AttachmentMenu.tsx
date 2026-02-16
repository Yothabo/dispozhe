import React from 'react';
import { FaImage, FaFilePdf, FaFileWord } from 'react-icons/fa';

interface AttachmentMenuProps {
  onSelectImage: () => void;
  onSelectPDF: () => void;
  onSelectWord: () => void;
  onClose: () => void;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  onSelectImage,
  onSelectPDF,
  onSelectWord,
  onClose
}) => {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-around">
            <button
              onClick={onSelectImage}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-sky/20 flex items-center justify-center">
                <FaImage className="w-6 h-6 text-sky" />
              </div>
              <span className="text-xs text-white">Image</span>
            </button>
            <button
              onClick={onSelectPDF}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-sky/20 flex items-center justify-center">
                <FaFilePdf className="w-6 h-6 text-sky" />
              </div>
              <span className="text-xs text-white">PDF</span>
            </button>
            <button
              onClick={onSelectWord}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-sky/20 flex items-center justify-center">
                <FaFileWord className="w-6 h-6 text-sky" />
              </div>
              <span className="text-xs text-white">Word</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-2 px-4 py-2 text-xs text-grey hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentMenu;
