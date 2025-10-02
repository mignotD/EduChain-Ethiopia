-- Add email template customization columns to university_settings
ALTER TABLE university_settings
  ADD COLUMN IF NOT EXISTS email_header_text TEXT NOT NULL DEFAULT 'EduChain Ethiopia',
  ADD COLUMN IF NOT EXISTS email_body_prefix TEXT NOT NULL DEFAULT 'A new certificate has been issued:',
  ADD COLUMN IF NOT EXISTS email_footer_text TEXT NOT NULL DEFAULT 'EduChain Ethiopia — Secure Academic Credential Verification',
  ADD COLUMN IF NOT EXISTS email_primary_color TEXT NOT NULL DEFAULT '#1a365d';
