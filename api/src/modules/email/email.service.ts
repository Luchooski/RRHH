import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

// Tipos de templates de emails
export type EmailTemplate =
  | 'application_received'
  | 'application_reviewed'
  | 'interview_scheduled'
  | 'application_accepted'
  | 'application_rejected'
  | 'offer_sent'
  | 'hired'
  | 'leave_approved'
  | 'leave_rejected'
  | 'password_reset'
  | 'welcome';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

// Configurar transporter de nodemailer
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  // Configuración de SMTP
  const config: any = {
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE || false, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  };
  transporter = nodemailer.createTransport(config);

  return transporter;
}

/**
 * Generar contenido del email basado en el template
 */
function generateEmailContent(template: EmailTemplate, data: Record<string, any>): { subject: string; html: string; text: string } {
  const templates: Record<EmailTemplate, (data: any) => { subject: string; html: string; text: string }> = {
    application_received: (data) => ({
      subject: `¡Recibimos tu postulación para ${data.vacancyTitle}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">¡Gracias por postularte!</h2>
          <p>Hola <strong>${data.candidateName}</strong>,</p>
          <p>Hemos recibido tu postulación para la posición de <strong>${data.vacancyTitle}</strong>.</p>
          <p>Nuestro equipo revisará tu perfil y nos pondremos en contacto contigo pronto.</p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `Hola ${data.candidateName}, hemos recibido tu postulación para ${data.vacancyTitle}. Nos pondremos en contacto pronto.`,
    }),

    application_reviewed: (data) => ({
      subject: `Actualización de tu postulación - ${data.vacancyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Actualización de tu postulación</h2>
          <p>Hola <strong>${data.candidateName}</strong>,</p>
          <p>Hemos revisado tu postulación para <strong>${data.vacancyTitle}</strong>.</p>
          <p>Tu postulación ha avanzado a la siguiente etapa: <strong>${data.newStage}</strong></p>
          <p>Estaremos en contacto contigo próximamente con más información.</p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `Hola ${data.candidateName}, tu postulación para ${data.vacancyTitle} ha avanzado a: ${data.newStage}.`,
    }),

    interview_scheduled: (data) => ({
      subject: `Entrevista programada - ${data.vacancyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">¡Entrevista programada!</h2>
          <p>Hola <strong>${data.candidateName}</strong>,</p>
          <p>Nos complace informarte que hemos programado una entrevista para la posición de <strong>${data.vacancyTitle}</strong>.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Fecha:</strong> ${data.interviewDate}</p>
            <p><strong>Hora:</strong> ${data.interviewTime}</p>
            <p><strong>Tipo:</strong> ${data.interviewType || 'Presencial'}</p>
            ${data.interviewLink ? `<p><strong>Link:</strong> <a href="${data.interviewLink}">${data.interviewLink}</a></p>` : ''}
            ${data.interviewLocation ? `<p><strong>Ubicación:</strong> ${data.interviewLocation}</p>` : ''}
          </div>
          ${data.notes ? `<p><strong>Notas:</strong> ${data.notes}</p>` : ''}
          <p>¡Te deseamos mucho éxito!</p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `Hola ${data.candidateName}, tienes una entrevista programada el ${data.interviewDate} a las ${data.interviewTime}.`,
    }),

    application_accepted: (data) => ({
      subject: `¡Felicitaciones! - ${data.vacancyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">¡Felicitaciones!</h2>
          <p>Hola <strong>${data.candidateName}</strong>,</p>
          <p>Nos complace informarte que has sido seleccionado/a para la posición de <strong>${data.vacancyTitle}</strong>.</p>
          <p>Pronto nos pondremos en contacto contigo con los siguientes pasos.</p>
          <br>
          <p>¡Bienvenido/a al equipo!<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `¡Felicitaciones ${data.candidateName}! Has sido seleccionado/a para ${data.vacancyTitle}.`,
    }),

    application_rejected: (data) => ({
      subject: `Actualización de tu postulación - ${data.vacancyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Actualización de tu postulación</h2>
          <p>Hola <strong>${data.candidateName}</strong>,</p>
          <p>Gracias por tu interés en la posición de <strong>${data.vacancyTitle}</strong>.</p>
          <p>Después de una cuidadosa revisión, hemos decidido avanzar con otros candidatos que mejor se ajustan a los requisitos actuales del puesto.</p>
          <p>Apreciamos mucho el tiempo que dedicaste al proceso y te animamos a postularte para futuras oportunidades.</p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `Hola ${data.candidateName}, gracias por tu interés en ${data.vacancyTitle}. En esta ocasión avanzamos con otros candidatos.`,
    }),

    offer_sent: (data) => ({
      subject: `Oferta de trabajo - ${data.vacancyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Oferta de Trabajo</h2>
          <p>Hola <strong>${data.candidateName}</strong>,</p>
          <p>Nos complace enviarte una oferta formal para la posición de <strong>${data.vacancyTitle}</strong>.</p>
          <p>Por favor revisa los detalles adjuntos y haznos saber tu decisión.</p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `Hola ${data.candidateName}, te enviamos una oferta para ${data.vacancyTitle}.`,
    }),

    hired: (data) => ({
      subject: `¡Bienvenido/a a ${data.companyName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">¡Bienvenido/a!</h2>
          <p>Hola <strong>${data.employeeName}</strong>,</p>
          <p>¡Bienvenido/a a <strong>${data.companyName}</strong>!</p>
          <p>Estamos emocionados de tenerte en nuestro equipo.</p>
          ${data.startDate ? `<p>Tu fecha de inicio es: <strong>${data.startDate}</strong></p>` : ''}
          <p>Pronto recibirás más información sobre los próximos pasos.</p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `¡Bienvenido/a ${data.employeeName} a ${data.companyName}!`,
    }),

    leave_approved: (data) => ({
      subject: `Licencia aprobada`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Licencia Aprobada</h2>
          <p>Hola <strong>${data.employeeName}</strong>,</p>
          <p>Tu solicitud de licencia ha sido <strong>aprobada</strong>.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tipo:</strong> ${data.leaveType}</p>
            <p><strong>Desde:</strong> ${data.startDate}</p>
            <p><strong>Hasta:</strong> ${data.endDate}</p>
            ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
          </div>
          <p>¡Que disfrutes tu tiempo libre!</p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `Hola ${data.employeeName}, tu licencia del ${data.startDate} al ${data.endDate} ha sido aprobada.`,
    }),

    leave_rejected: (data) => ({
      subject: `Actualización de solicitud de licencia`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Solicitud de Licencia</h2>
          <p>Hola <strong>${data.employeeName}</strong>,</p>
          <p>Lamentamos informarte que tu solicitud de licencia no ha sido aprobada.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tipo:</strong> ${data.leaveType}</p>
            <p><strong>Desde:</strong> ${data.startDate}</p>
            <p><strong>Hasta:</strong> ${data.endDate}</p>
            ${data.rejectionReason ? `<p><strong>Motivo:</strong> ${data.rejectionReason}</p>` : ''}
          </div>
          <p>Por favor contacta a tu supervisor si tienes preguntas.</p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `Hola ${data.employeeName}, tu solicitud de licencia del ${data.startDate} al ${data.endDate} no ha sido aprobada.`,
    }),

    password_reset: (data) => ({
      subject: `Restablecer contraseña`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Restablecer Contraseña</h2>
          <p>Hola,</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <p style="margin: 20px 0;">
            <a href="${data.resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </p>
          <p><small>Si no solicitaste este cambio, puedes ignorar este email.</small></p>
          <p><small>Este enlace expira en 1 hora.</small></p>
        </div>
      `,
      text: `Restablecer contraseña: ${data.resetLink}`,
    }),

    welcome: (data) => ({
      subject: `Bienvenido/a a ${data.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">¡Bienvenido/a!</h2>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>Tu cuenta ha sido creada exitosamente.</p>
          <p>Ya puedes acceder al sistema con tu email: <strong>${data.email}</strong></p>
          ${data.temporaryPassword ? `<p>Tu contraseña temporal es: <strong>${data.temporaryPassword}</strong></p>` : ''}
          <p><small>Te recomendamos cambiar tu contraseña al iniciar sesión por primera vez.</small></p>
          <br>
          <p>Saludos,<br><strong>${data.companyName}</strong></p>
        </div>
      `,
      text: `Bienvenido/a ${data.name}! Tu cuenta ha sido creada.`,
    }),
  };

  const generator = templates[template];
  if (!generator) {
    throw new Error(`Template "${template}" no encontrado`);
  }

  return generator(data);
}

/**
 * Enviar email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Si no hay configuración de SMTP, solo logear (modo desarrollo)
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      console.log('[EMAIL] No SMTP configuration found. Email would be sent to:', options.to);
      console.log('[EMAIL] Template:', options.template);
      console.log('[EMAIL] Data:', options.data);
      return true;
    }

    const transport = getTransporter();

    const content = generateEmailContent(options.template, options.data);

    const mailOptions = {
      from: options.from || env.SMTP_FROM || env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject || content.subject,
      text: content.text,
      html: content.html,
    };

    await transport.sendMail(mailOptions);
    console.log('[EMAIL] Email sent successfully to:', options.to);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Error sending email:', error.message);
    return false;
  }
}

/**
 * Enviar email de cambio de etapa en pipeline
 */
export async function sendPipelineStageChangeEmail(
  candidateEmail: string,
  candidateName: string,
  vacancyTitle: string,
  newStage: string,
  companyName: string
): Promise<boolean> {
  // Determinar qué template usar según la etapa
  let template: EmailTemplate = 'application_reviewed';

  const stageLower = newStage.toLowerCase();

  if (stageLower.includes('recibid') || stageLower.includes('postulad')) {
    template = 'application_received';
  } else if (stageLower.includes('entrevista')) {
    template = 'interview_scheduled';
  } else if (stageLower.includes('aceptad') || stageLower.includes('seleccionad')) {
    template = 'application_accepted';
  } else if (stageLower.includes('rechazad') || stageLower.includes('descartad')) {
    template = 'application_rejected';
  } else if (stageLower.includes('oferta')) {
    template = 'offer_sent';
  } else if (stageLower.includes('contratad') || stageLower.includes('hired')) {
    template = 'hired';
  }

  return sendEmail({
    to: candidateEmail,
    subject: '', // El template genera el subject
    template,
    data: {
      candidateName,
      vacancyTitle,
      newStage,
      companyName,
    },
  });
}
