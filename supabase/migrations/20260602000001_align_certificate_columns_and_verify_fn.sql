-- Align the live certificates schema with the application's expected column names
-- and repair verify_certificate_public.
--
-- Background: the application code and the verify RPC expected columns
-- issued_at / qr_code / honors, but the deployed table only had issue_date /
-- qr_code_data. The mismatch made verify_certificate_public throw
-- "column c.issued_at does not exist", so the public Verify page returned nothing.
-- This migration codifies the hand-applied production fix so it never regresses
-- on a fresh deploy.

-- 1. Add the columns the app expects (idempotent).
--    NOTE: issued_at is added WITHOUT a NOT NULL DEFAULT now() on purpose — a
--    default would clobber existing rows with the migration timestamp. We add it
--    nullable, backfill from issue_date, then it can be relied on going forward.
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS qr_code   TEXT,
  ADD COLUMN IF NOT EXISTS honors    TEXT;

-- 2. Backfill from the legacy columns where present.
UPDATE public.certificates
SET issued_at = COALESCE(issued_at, issue_date::timestamptz)
WHERE issued_at IS NULL AND issue_date IS NOT NULL;

UPDATE public.certificates
SET qr_code = qr_code_data
WHERE qr_code IS NULL AND qr_code_data IS NOT NULL;

-- 3. Default future inserts to now() and enforce NOT NULL once backfilled.
ALTER TABLE public.certificates
  ALTER COLUMN issued_at SET DEFAULT now();

UPDATE public.certificates SET issued_at = now() WHERE issued_at IS NULL;

ALTER TABLE public.certificates
  ALTER COLUMN issued_at SET NOT NULL;

-- 4. Recreate the public verification function.
--    Fix: cast c.status (enum certificate_status) to text so the returned row
--    matches the declared TABLE(... status text ...) signature.
DROP FUNCTION IF EXISTS public.verify_certificate_public(text);

CREATE OR REPLACE FUNCTION public.verify_certificate_public(cert_id text)
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
    c.status::text AS status,
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
      null::text, null::text, null::text, null::text, null::date,
      null::text, null::timestamptz, null::numeric, null::text,
      null::text, null::text, null::timestamptz, null::date, false;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cert_record.status = 'active'
      AND (cert_record.expiry_date IS NULL OR cert_record.expiry_date >= CURRENT_DATE) AS is_valid,
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
    cert_record.expiry_date IS NOT NULL AND cert_record.expiry_date < CURRENT_DATE AS is_expired;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate_public TO anon, authenticated;
