-- Drop and recreate the verify_certificate_public function to include gpa and honors
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
  honors text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN c.certificate_id IS NOT NULL THEN true ELSE false END as is_valid,
    c.certificate_id,
    c.student_name,
    c.degree,
    c.field_of_study,
    c.graduation_date,
    c.university_name,
    c.issued_at,
    c.gpa,
    c.honors
  FROM certificates c
  WHERE c.certificate_id = cert_id
    AND c.status = 'active'
  LIMIT 1;
  
  -- If no certificate found, return invalid result
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      false as is_valid,
      null::text as certificate_id,
      null::text as student_name,
      null::text as degree,
      null::text as field_of_study,
      null::date as graduation_date,
      null::text as university_name,
      null::timestamp with time zone as issued_at,
      null::numeric as gpa,
      null::text as honors;
  END IF;
END;
$$;