import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { http } from '../../lib/http';

type Attachment = {
  id: string;
  filename: string;
  fileType: 'dni' | 'cv' | 'contract' | 'certificate' | 'photo' | 'other';
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
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
  const { data, isLoading } = useQuery<{ items: Attachment[]; total: number }>({
    queryKey: ['employee-documents'],
    queryFn: () => http.get('/api/v1/employee-portal/attachments', { auth: true }),
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }

  const documents = data?.items || [];

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

      {documents.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No tienes documentos cargados
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
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

              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => handleDownload(doc.id, doc.filename)}
              >
                📥 Descargar
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
