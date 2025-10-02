import { supabase } from '@/integrations/supabase/client';

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
}

export interface EmailTemplate {
  headerText: string;
  bodyPrefix: string;
  footerText: string;
  primaryColor: string;
}

async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-confirmation-email', {
      body: params,
    });

    if (error) {
      console.error('Failed to send email:', error);
    }
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

export async function fetchEmailTemplate(universityCode: string): Promise<EmailTemplate | null> {
  try {
    const { data } = await supabase
      .from('university_settings')
      .select('email_header_text, email_body_prefix, email_footer_text, email_primary_color')
      .eq('university_code', universityCode)
      .single();

    if (!data) return null;

    return {
      headerText: data.email_header_text || 'EduChain Ethiopia',
      bodyPrefix: data.email_body_prefix || 'A new certificate has been issued:',
      footerText: data.email_footer_text || 'EduChain Ethiopia — Secure Academic Credential Verification',
      primaryColor: data.email_primary_color || '#1a365d',
    };
  } catch {
    return null;
  }
}

export function buildCertificateIssuedEmail(opts: {
  studentName: string;
  degree: string;
  university: string;
  certificateId: string;
  template?: EmailTemplate;
}) {
  const t = opts.template || {
    headerText: 'EduChain Ethiopia',
    bodyPrefix: 'A new certificate has been issued:',
    footerText: 'EduChain Ethiopia — Secure Academic Credential Verification',
    primaryColor: '#1a365d',
  };

  const verifyUrl = `${window.location.origin}/verify/${opts.certificateId}`;
  return {
    subject: `Certificate Issued — ${opts.studentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${t.primaryColor}; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${t.headerText}</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: ${t.primaryColor}; margin-top: 0;">Certificate Issued Successfully</h2>
          <p style="color: #475569; line-height: 1.6;">${t.bodyPrefix}</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #64748b; width: 120px;">Student</td><td style="padding: 8px; font-weight: 600;">${opts.studentName}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Degree</td><td style="padding: 8px; font-weight: 600;">${opts.degree}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">University</td><td style="padding: 8px; font-weight: 600;">${opts.university}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Certificate ID</td><td style="padding: 8px; font-family: monospace;">${opts.certificateId}</td></tr>
          </table>
          <a href="${verifyUrl}" style="display: inline-block; background: ${t.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 8px;">View Certificate</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">${t.footerText}</p>
        </div>
      </div>
    `,
  };
}

export function buildCertificateRevokedEmail(opts: {
  studentName: string;
  certificateId: string;
  reason: string;
  template?: Pick<EmailTemplate, 'headerText' | 'footerText'>;
}) {
  const t = opts.template || {
    headerText: 'EduChain Ethiopia',
    footerText: 'EduChain Ethiopia — Secure Academic Credential Verification',
  };

  return {
    subject: `Certificate Revoked — ${opts.studentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #991b1b; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${t.headerText}</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #991b1b; margin-top: 0;">Certificate Revoked</h2>
          <p style="color: #475569; line-height: 1.6;">The following certificate has been revoked:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #64748b; width: 120px;">Student</td><td style="padding: 8px; font-weight: 600;">${opts.studentName}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Certificate ID</td><td style="padding: 8px; font-family: monospace;">${opts.certificateId}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Reason</td><td style="padding: 8px; font-weight: 600;">${opts.reason}</td></tr>
          </table>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">${t.footerText}</p>
        </div>
      </div>
    `,
  };
}

export { sendEmail };
