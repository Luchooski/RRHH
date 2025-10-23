import { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Film } from 'lucide-react';

interface DocumentPreviewProps {
  documentId: string;
  filename: string;
  mimeType: string;
  onClose: () => void;
}

export function DocumentPreview({ documentId, filename, mimeType, onClose }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = `/api/v1/attachments/${documentId}/preview`;
  const downloadUrl = `/api/v1/attachments/${documentId}/download`;

  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const canPreview = isPDF || isImage;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.click();
  };

  const renderPreview = () => {
    if (!canPreview) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <FileText className="h-24 w-24 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No se puede previsualizar este tipo de archivo
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            {filename}
          </p>
          <button onClick={handleDownload} className="btn btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Descargar Archivo
          </button>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="h-full w-full">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="h-24 w-24 text-red-400 mb-4" />
              <p className="text-red-600 mb-4">Error al cargar el PDF</p>
              <button onClick={handleDownload} className="btn btn-primary">
                <Download className="h-4 w-4 mr-2" />
                Descargar en su lugar
              </button>
            </div>
          )}
          <iframe
            src={previewUrl}
            className={`w-full h-full border-0 ${loading || error ? 'hidden' : ''}`}
            title={filename}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Error al cargar el PDF');
            }}
          />
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          {loading && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          )}
          {error && (
            <div className="flex flex-col items-center">
              <ImageIcon className="h-24 w-24 text-red-400 mb-4" />
              <p className="text-red-600 mb-4">Error al cargar la imagen</p>
              <button onClick={handleDownload} className="btn btn-primary">
                <Download className="h-4 w-4 mr-2" />
                Descargar en su lugar
              </button>
            </div>
          )}
          <img
            src={previewUrl}
            alt={filename}
            className={`max-w-full max-h-full object-contain ${loading || error ? 'hidden' : ''}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Error al cargar la imagen');
            }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPDF && <FileText className="h-5 w-5 text-red-600" />}
            {isImage && <ImageIcon className="h-5 w-5 text-blue-600" />}
            {isVideo && <Film className="h-5 w-5 text-purple-600" />}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{filename}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{mimeType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="btn btn-ghost"
              title="Descargar"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}
