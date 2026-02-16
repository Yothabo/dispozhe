import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaSearchPlus, FaSearchMinus, FaFilePdf, FaFileWord, FaFileAlt, FaImage } from 'react-icons/fa';

interface FileMessage {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  viewOnce: boolean;
  viewed?: boolean;
}

interface FileViewerProps {
  file: FileMessage;
  onClose: () => void;
  onViewed?: (fileId: string) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose, onViewed }) => {
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [docContent, setDocContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasNotifiedView, setHasNotifiedView] = useState(false);

  useEffect(() => {
    if (file.type.includes('pdf')) {
      renderPDF();
    } else if (file.type.includes('word') || file.type.includes('document') || file.type.includes('text')) {
      renderTextDocument();
    } else {
      setLoading(false);
    }
  }, [file]);

  useEffect(() => {
    if (!loading && !hasNotifiedView && onViewed) {
      onViewed(file.id);
      setHasNotifiedView(true);
    }
  }, [loading, hasNotifiedView, onViewed, file.id]);

  const renderPDF = async () => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const loadingTask = pdfjsLib.getDocument({ data: atob(file.data) });
      const pdf = await loadingTask.promise;
      
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context!,
          viewport: viewport,
          canvas: canvas
        }).promise;
        
        pages.push(canvas.toDataURL('image/jpeg', 0.8));
      }
      setPdfPages(pages);
      setCurrentPage(0);
      setLoading(false);
    } catch (error) {
      console.error('Failed to render PDF:', error);
      setLoading(false);
    }
  };

  const renderTextDocument = () => {
    try {
      const text = atob(file.data);
      setDocContent(text);
      setLoading(false);
    } catch (error) {
      console.error('Failed to render document:', error);
      setDocContent('Unable to display this document');
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return FaImage;
    if (file.type.includes('pdf')) return FaFilePdf;
    if (file.type.includes('word') || file.type.includes('doc')) return FaFileWord;
    return FaFileAlt;
  };

  const FileIcon = getFileIcon();
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy/95 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-white font-medium">{file.name}</h3>
            <p className="text-grey text-xs">{formatFileSize(file.size)}</p>
          </div>
        </div>
        {file.type.includes('pdf') && pdfPages.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10"
              >
                <FaSearchMinus className="w-4 h-4" />
              </button>
              <span className="text-white text-sm">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10"
              >
                <FaSearchPlus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-50"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white text-sm">
                {currentPage + 1} / {pdfPages.length}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(pdfPages.length - 1, p + 1))}
                disabled={currentPage === pdfPages.length - 1}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-50"
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-sky/30 border-t-sky rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-grey">Loading file...</p>
            </div>
          ) : (
            <>
              {file.type.startsWith('image/') ? (
                <img
                  src={`data:${file.type};base64,${file.data}`}
                  alt={file.name}
                  className="max-w-full h-auto mx-auto rounded-lg"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              ) : file.type.includes('pdf') ? (
                <div className="flex flex-col items-center gap-4">
                  {pdfPages.length > 0 ? (
                    <img
                      src={pdfPages[currentPage]}
                      alt={`PDF page ${currentPage + 1}`}
                      className="max-w-full h-auto mx-auto rounded-lg shadow-2xl"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  ) : (
                    <p className="text-grey">Failed to load PDF</p>
                  )}
                </div>
              ) : file.type.includes('word') || file.type.includes('document') ? (
                <div className="glass rounded-2xl p-8">
                  <div className="prose prose-invert max-w-none">
                    <pre className="text-white whitespace-pre-wrap font-mono text-sm bg-transparent border-none p-0">
                      {docContent || 'No content to display'}
                    </pre>
                  </div>
                </div>
              ) : file.type.includes('text') ? (
                <div className="glass rounded-2xl p-8">
                  <pre className="text-white whitespace-pre-wrap font-mono text-sm">
                    {docContent}
                  </pre>
                </div>
              ) : (
                <div className="glass rounded-2xl p-8 text-center">
                  <FileIcon className="w-16 h-16 text-sky mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{file.name}</h3>
                  <p className="text-grey mb-6">{formatFileSize(file.size)}</p>
                  <p className="text-sky text-sm">Preview not available for this file type</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="border-t border-white/5 p-4">
        <p className="text-center text-sky text-sm">
          {file.viewOnce ? 'This file will disappear after you close this view' : 'View once'}
        </p>
      </div>
    </div>
  );
};

export default FileViewer;
