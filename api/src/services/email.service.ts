import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Crear transporter de nodemailer
const createTransporter = () => {
  // En producción, usar SMTP configurado
  if (env.isProd && env.SMTP_HOST) {
    return nodemailer.createTransporter({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  // En desarrollo, usar ethereal (email de prueba)
  // Los emails no se envían realmente, pero se puede ver en https://ethereal.email
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.password',
    },
  });
};

interface SendApplicationConfirmationParams {
  to: string;
  candidateName: string;
  companyName: string;
  vacancyTitle?: string;
}

/**
 * Envía email de confirmación a candidato después de aplicar
 */
export async function sendApplicationConfirmation(params: SendApplicationConfirmationParams) {
  const { to, candidateName, companyName, vacancyTitle } = params;

  // Si no hay configuración de email, solo logear
  if (!env.SMTP_HOST && env.isProd) {
    console.log('[EMAIL] No SMTP configured. Would send confirmation to:', to);
    return { success: false, message: 'Email not configured' };
  }

  try {
    const transporter = createTransporter();

    const subject = `Aplicación recibida - ${companyName}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .card {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .highlight {
              background: #e0e7ff;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #667eea;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .check-icon {
              width: 60px;
              height: 60px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 32px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${companyName}</h1>
          </div>

          <div class="content">
            <div class="card">
              <div class="check-icon">✓</div>

              <h2 style="text-align: center; color: #1f2937; margin-top: 0;">
                ¡Aplicación Recibida!
              </h2>

              <p>Hola <strong>${candidateName}</strong>,</p>

              <p>
                Gracias por tu interés en unirte a nuestro equipo en <strong>${companyName}</strong>.
                Hemos recibido tu aplicación exitosamente.
              </p>

              ${vacancyTitle ? `
                <div class="highlight">
                  <strong>Posición:</strong> ${vacancyTitle}
                </div>
              ` : ''}

              <p>
                Nuestro equipo de Recursos Humanos revisará tu CV y experiencia.
                Si tu perfil se ajusta a lo que estamos buscando, nos pondremos en contacto
                contigo pronto para los siguientes pasos del proceso de selección.
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                <strong>Próximos pasos:</strong>
              </p>
              <ul style="color: #6b7280; font-size: 14px;">
                <li>Revisaremos tu CV en los próximos días</li>
                <li>Te contactaremos si tu perfil es seleccionado</li>
                <li>Coordinaremos una entrevista si avanzas en el proceso</li>
              </ul>
            </div>

            <div class="footer">
              <p>
                Este es un email automático. Por favor no respondas a este mensaje.
              </p>
              <p style="margin-top: 10px;">
                &copy; ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Hola ${candidateName},

Gracias por tu interés en unirte a nuestro equipo en ${companyName}.
Hemos recibido tu aplicación exitosamente.

${vacancyTitle ? `Posición: ${vacancyTitle}\n` : ''}

Nuestro equipo de Recursos Humanos revisará tu CV y experiencia.
Si tu perfil se ajusta a lo que estamos buscando, nos pondremos en contacto contigo pronto.

Próximos pasos:
- Revisaremos tu CV en los próximos días
- Te contactaremos si tu perfil es seleccionado
- Coordinaremos una entrevista si avanzas en el proceso

Este es un email automático. Por favor no respondas a este mensaje.

© ${new Date().getFullYear()} ${companyName}
    `.trim();

    const info = await transporter.sendMail({
      from: env.SMTP_FROM || `"${companyName}" <noreply@${env.SMTP_HOST || 'example.com'}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('[EMAIL] Confirmation sent:', info.messageId);

    // En desarrollo con ethereal, mostrar URL de preview
    if (!env.isProd && info.response.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[EMAIL] Preview URL:', previewUrl);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL] Error sending confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía notificación al equipo de HR cuando se recibe una nueva aplicación
 */
export async function sendNewApplicationNotification(params: {
  to: string;
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  vacancyTitle?: string;
  careersUrl: string;
}) {
  const { to, candidateName, candidateEmail, companyName, vacancyTitle, careersUrl } = params;

  if (!env.SMTP_HOST && env.isProd) {
    console.log('[EMAIL] No SMTP configured. Would send notification to:', to);
    return { success: false, message: 'Email not configured' };
  }

  try {
    const transporter = createTransporter();

    const subject = `Nueva aplicación recibida${vacancyTitle ? ` - ${vacancyTitle}` : ''}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .card { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .label { font-weight: bold; color: #4b5563; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🎯 Nueva Aplicación Recibida</h2>
          </div>
          <div class="content">
            <div class="card">
              <p><span class="label">Candidato:</span> ${candidateName}</p>
              <p><span class="label">Email:</span> ${candidateEmail}</p>
              ${vacancyTitle ? `<p><span class="label">Vacante:</span> ${vacancyTitle}</p>` : ''}
              <p><span class="label">Fuente:</span> Página de Carreras</p>
            </div>
            <p>Revisa el perfil del candidato en tu dashboard de HR.</p>
            <a href="${careersUrl}" class="button">Ver Dashboard</a>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: env.SMTP_FROM || `"${companyName} HR" <noreply@${env.SMTP_HOST || 'example.com'}>`,
      to,
      subject,
      html,
    });

    console.log('[EMAIL] HR notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL] Error sending HR notification:', error);
    return { success: false, error: error.message };
  }
}
