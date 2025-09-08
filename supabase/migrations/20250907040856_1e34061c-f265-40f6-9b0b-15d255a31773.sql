-- Update the verify_certificate_public function to include gpa and honors
CREATE OR REPLACE FUNCTION verify_certificate_public(cert_id text)
RETURNS TABLE(
  certificate_id text,
  student_name text,
  degree text,
  field_of_study text,
  graduation_date date,
  university_name text,
  issued_at timestamptz,
  gpa numeric,
  honors text,
  is_valid boolean
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
    c.issued_at,
    c.gpa,
    c.honors,
    (c.status = 'active') as is_valid
  FROM certificates c
  WHERE c.certificate_id = cert_id
    AND c.status = 'active';
END;
$$;