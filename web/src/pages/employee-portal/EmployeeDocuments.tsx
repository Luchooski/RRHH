import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Download, History, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { DocumentPreview } from '../../components/DocumentPreview';
import { http } from '../../lib/http';

type Attachment = {
  id: string;
  filename: string;
  fileType: 'dni' | 'cv' | 'contract' | 'certificate' | 'photo' | 'other';
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
  version?: number;
  isLatest?: boolean;
};

type Version = Attachment & {
  version: number;
  parentId: string | null;
  isLatest: boolean;
  versionNotes?: string;
};

const fileTypeLabels = {
  dni: 'DNI',
  cv: 'CV',
  contract: 'Contrato',
  certificate: 'Certificado',
  photo: 'Foto',
  other: 'Otro',
};

const fileTypeColors = {
  dni: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cv: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  contract: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  certificate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  photo: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function EmployeeDocuments() {
  const [searchText, setSearchText] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<Attachment | null>(null);
  const [versionsDoc, setVersionsDoc] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ items: Attachment[]; total: number }>({
    queryKey: ['employee-documents'],
    queryFn: () => http.get('/api/v1/employee-portal/attachments', { auth: true }),
  });

  const { data: versions } = useQuery<{ items: Version[]; total: number }>({
    queryKey: ['document-versions', versionsDoc],
    queryFn: () => http.get(`/api/v1/attachments/${versionsDoc}/versions`, { auth: true }),
    enabled: !!versionsDoc,
  });

  const handleDownload = async (id: string, filename: string) => {
    try {
      const blob = await http.blob(`/api/v1/employee-portal/attachments/${id}/download`, { auth: true });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const canPreview = (mimeType: string): boolean => {
    return mimeType === 'application/pdf' || mimeType.startsWith('image/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }

  const documents = data?.items || [];

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = searchText
      ? doc.filename.toLowerCase().includes(searchText.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchText.toLowerCase())
      : true;
    const matchesType = selectedFileType ? doc.fileType === selectedFileType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mis Documentos
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Archivos y documentos personales
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={selectedFileType}
          onChange={(e) => setSelectedFileType(e.target.value)}
          className="input w-full md:w-48"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(fileTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {(searchText || selectedFileType) && (
          <button
            onClick={() => {
              setSearchText('');
              setSelectedFileType('');
            }}
            className="btn btn-ghost"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </button>
        )}
      </div>

      {/* Results Count */}
      {(searchText || selectedFileType) && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredDocuments.length} de {documents.length} documentos
        </p>
      )}

      {filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {searchText || selectedFileType ? 'No se encontraron documentos' : 'No tienes documentos cargados'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getFileIcon(doc.mimeType)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {doc.filename}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(doc.size)}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-1 rounded-md text-xs font-medium ${fileTypeColors[doc.fileType]}`}>
                  {fileTypeLabels[doc.fileType]}
                </span>
              </div>

              {doc.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {doc.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span>Subido: {new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                {canPreview(doc.mimeType) && (
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="btn btn-ghost flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </button>
                )}
                <button
                  onClick={() => handleDownload(doc.id, doc.filename)}
                  className={`btn btn-primary ${canPreview(doc.mimeType) ? 'flex-1' : 'w-full'}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </button>
                <button
                  onClick={() => setVersionsDoc(doc.id)}
                  className="btn btn-ghost"
                  title="Ver historial"
                >
                  <History className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          documentId={previewDoc.id}
          filename={previewDoc.filename}
          mimeType={previewDoc.mimeType}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Versions Modal */}
      {versionsDoc && versions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Versiones</h2>
              <button
                onClick={() => setVersionsDoc(null)}
                className="btn btn-ghost"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {versions.items.map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 rounded-lg border ${
                      version.isLatest
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Versión {version.version}
                        </span>
                        {version.isLatest && (
                          <Badge variant="primary">Actual</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {version.versionNotes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {version.versionNotes}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {canPreview(version.mimeType) && (
                        <button
                          onClick={() => {
                            setPreviewDoc(version);
                            setVersionsDoc(null);
                          }}
                          className="btn btn-ghost btn-sm"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(version.id, version.filename)}
                        className="btn btn-primary btn-sm"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Descargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
