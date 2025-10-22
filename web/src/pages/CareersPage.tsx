import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { http } from '../lib/http';

interface Vacancy {
  id: string;
  title: string;
  description?: string;
  location?: string;
  employmentType?: string;
  status: string;
}

interface CompanyInfo {
  company: {
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    primaryColor?: string;
  };
  vacancies: Vacancy[];
}

interface ApplicationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vacancyId: string;
  cv: File | null;
}

export function CareersPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [formData, setFormData] = useState<ApplicationForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vacancyId: '',
    cv: null
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationForm, string>>>({});
  const [success, setSuccess] = useState(false);

  // Obtener información de la empresa y vacantes
  const { data: companyInfo, isLoading, error } = useQuery<CompanyInfo>({
    queryKey: ['public-careers', companySlug],
    queryFn: () => http.get(`/api/v1/public/careers/${companySlug}`),
    enabled: !!companySlug
  });

  // Mutación para enviar aplicación
  const submitApplication = useMutation({
    mutationFn: async (data: ApplicationForm) => {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', data.firstName);
      formDataToSend.append('lastName', data.lastName);
      formDataToSend.append('email', data.email);
      formDataToSend.append('phone', data.phone);
      if (data.vacancyId) {
        formDataToSend.append('vacancyId', data.vacancyId);
      }
      if (data.cv) {
        formDataToSend.append('file', data.cv);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/public/careers/${companySlug}/apply`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar la aplicación');
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        vacancyId: '',
        cv: null
      });
      setErrors({});
    },
    onError: (error: any) => {
      setErrors({ email: error.message || 'Error al enviar la aplicación' });
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationForm, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.cv) {
      newErrors.cv = 'El CV es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    submitApplication.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, cv: 'Solo se permiten archivos PDF o DOC/DOCX' });
        return;
      }

      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, cv: 'El archivo no debe superar los 5MB' });
        return;
      }

      setFormData({ ...formData, cv: file });
      setErrors({ ...errors, cv: undefined });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !companyInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Empresa no encontrada</h1>
          <p className="text-gray-600 dark:text-gray-400">
            La página de carreras que buscas no existe o no está disponible.
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = companyInfo?.company.primaryColor || '#6366f1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-custom py-8">
          <div className="flex items-start gap-6">
            {companyInfo.company.logo && (
              <img
                src={companyInfo.company.logo}
                alt={`${companyInfo.company.name} logo`}
                className="w-20 h-20 object-contain rounded-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {companyInfo.company.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {companyInfo.company.description || 'Únete a nuestro equipo'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vacantes disponibles */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Vacantes Disponibles
              </h2>

              {companyInfo.vacancies.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No hay vacantes abiertas en este momento. Puedes enviar tu CV de todas formas y te contactaremos cuando haya oportunidades.
                </p>
              ) : (
                <div className="space-y-3">
                  {companyInfo.vacancies.map((vacancy) => (
                    <div
                      key={vacancy.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.vacancyId === vacancy.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                      onClick={() => setFormData({ ...formData, vacancyId: vacancy.id })}
                    >
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {vacancy.title}
                      </h3>
                      {vacancy.location && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {vacancy.location}
                        </p>
                      )}
                      {vacancy.employmentType && (
                        <span className="badge badge-secondary text-xs mt-2 inline-block">
                          {vacancy.employmentType}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Formulario de aplicación */}
          <div className="lg:col-span-2">
            <div className="card">
              {success ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    ¡Aplicación enviada!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Gracias por tu interés. Revisaremos tu CV y nos pondremos en contacto contigo pronto.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="btn btn-primary"
                  >
                    Enviar otra aplicación
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    Envía tu CV
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Nombre *</label>
                        <input
                          type="text"
                          className={`input ${errors.firstName ? 'input-error' : ''}`}
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.firstName}</p>
                        )}
                      </div>

                      <div>
                        <label className="label">Apellido *</label>
                        <input
                          type="text"
                          className={`input ${errors.lastName ? 'input-error' : ''}`}
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="label">Email *</label>
                      <input
                        type="email"
                        className={`input ${errors.email ? 'input-error' : ''}`}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Teléfono</label>
                      <input
                        type="tel"
                        className="input"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="label">CV (PDF o DOC/DOCX) *</label>
                      <div className="mt-1">
                        <label className="block border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                          />
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {formData.cv ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formData.cv.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {(formData.cv.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Haz clic para seleccionar un archivo
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PDF, DOC o DOCX hasta 5MB
                              </p>
                            </>
                          )}
                        </label>
                        {errors.cv && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.cv}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitApplication.isPending}
                      className="btn btn-primary w-full"
                    >
                      {submitApplication.isPending ? (
                        <>
                          <div className="spinner"></div>
                          Enviando...
                        </>
                      ) : (
                        'Enviar aplicación'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
