import { StrictMode, Suspense } from 'react';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './app/ThemeProvider';
import './styles/print.css';
import { AuthProvider } from './features/auth/auth';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmDialogController } from './components/ui/ConfirmDialog';



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={<div className="p-6">Cargando…</div>}>
              <RouterProvider router={router} />
            </Suspense>
            <ConfirmDialogController />
          </AuthProvider>
        </ToastProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
