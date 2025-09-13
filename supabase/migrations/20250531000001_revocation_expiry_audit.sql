-- Phase 1: Revocation + Audit Trail + Certificate Expiry

-- 1. Add revocation fields to certificates
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revocation_reason TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES public.profiles(user_id);

-- 2. Add expiry date to certificates
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 3. Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    certificate_id TEXT REFERENCES public.certificates(certificate_id) ON DELETE SET NULL,
    actor_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    university_code TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_logs
CREATE POLICY "Admins can view their university's activity logs"
ON public.activity_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND (
            role = 'super_admin'
            OR university_code = activity_logs.university_code
        )
    )
);

CREATE POLICY "Admins can insert activity logs for their university"
ON public.activity_logs
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND (
            role = 'super_admin'
            OR university_code = activity_logs.university_code
        )
    )
);

-- Index for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_university_code ON public.activity_logs(university_code);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_certificate_id ON public.activity_logs(certificate_id);

-- 4. Updated verify_certificate_public function with revocation info and expiry
DROP FUNCTION IF EXISTS verify_certificate_public(text);

CREATE OR REPLACE FUNCTION verify_certificate_public(cert_id text)
RETURNS TABLE(
  is_valid boolean,
  certificate_id text,
  student_name text,
  degree text,
  field_of_study text,
  graduation_date date,
  university_name text,
  issued_at timestamptz,
  gpa numeric,
  honors text,
  status text,
  revocation_reason text,
  revoked_at timestamptz,
  expiry_date date,
  is_expired boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  cert_record RECORD;
BEGIN
  SELECT 
    c.certificate_id,
    c.student_name,
    c.degree,
    c.field_of_study,
    c.graduation_date,
    c.university_name,
    c.issued_at,
    c.gpa,
    c.honors,
    c.status,
    c.revocation_reason,
    c.revoked_at,
    c.expiry_date
  INTO cert_record
  FROM certificates c
  WHERE c.certificate_id = cert_id
  LIMIT 1;

  IF cert_record.certificate_id IS NULL THEN
    RETURN QUERY
    SELECT 
      false,
      null::text,
      null::text,
      null::text,
      null::text,
      null::date,
      null::text,
      null::timestamp with time zone,
      null::numeric,
      null::text,
      null::text,
      null::text,
      null::timestamp with time zone,
      null::date,
      false;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    cert_record.status = 'active' 
      AND (cert_record.expiry_date IS NULL OR cert_record.expiry_date >= CURRENT_DATE) as is_valid,
    cert_record.certificate_id,
    cert_record.student_name,
    cert_record.degree,
    cert_record.field_of_study,
    cert_record.graduation_date,
    cert_record.university_name,
    cert_record.issued_at,
    cert_record.gpa,
    cert_record.honors,
    cert_record.status,
    cert_record.revocation_reason,
    cert_record.revoked_at,
    cert_record.expiry_date,
    cert_record.expiry_date IS NOT NULL AND cert_record.expiry_date < CURRENT_DATE as is_expired;
END;
$$;

-- 5. Function to get certificates for a student (public, for student portal)
CREATE OR REPLACE FUNCTION get_student_certificates(student_id_param text)
RETURNS TABLE(
  certificate_id text,
  student_name text,
  degree text,
  field_of_study text,
  graduation_date date,
  university_name text,
  status text,
  issued_at timestamptz,
  gpa numeric,
  honors text,
  expiry_date date,
  is_expired boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.certificate_id,
    c.student_name,
    c.degree,
    c.field_of_study,
    c.graduation_date,
    c.university_name,
    c.status,
    c.issued_at,
    c.gpa,
    c.honors,
    c.expiry_date,
    c.expiry_date IS NOT NULL AND c.expiry_date < CURRENT_DATE as is_expired
  FROM certificates c
  WHERE c.student_id = student_id_param
    AND c.status IN ('active', 'expired')
  ORDER BY c.graduation_date DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_certificate_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_student_certificates TO anon, authenticated;
