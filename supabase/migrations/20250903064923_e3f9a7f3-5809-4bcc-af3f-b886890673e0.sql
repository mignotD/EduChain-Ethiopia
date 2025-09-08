-- Remove the overly permissive policy that exposes all certificate data
DROP POLICY "Anyone can verify certificates by ID" ON public.certificates;

-- Create a secure verification function that only returns validation data
CREATE OR REPLACE FUNCTION public.verify_certificate_public(cert_id text)
RETURNS TABLE(
  is_valid boolean,
  student_name text,
  degree text,
  field_of_study text,
  university_name text,
  graduation_date date,
  issued_at timestamp with time zone,
  certificate_id text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN c.certificate_id IS NOT NULL THEN true ELSE false END as is_valid,
    c.student_name,
    c.degree,
    c.field_of_study,
    c.university_name,
    c.graduation_date,
    c.issued_at,
    c.certificate_id
  FROM public.certificates c
  WHERE c.certificate_id = cert_id 
    AND c.status = 'active'
  LIMIT 1;
  
  -- If no certificate found, return invalid result
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      false as is_valid,
      null::text as student_name,
      null::text as degree,
      null::text as field_of_study,
      null::text as university_name,
      null::date as graduation_date,
      null::timestamp with time zone as issued_at,
      null::text as certificate_id;
  END IF;
END;
$$;

-- Grant execute permission to anonymous users for verification
GRANT EXECUTE ON FUNCTION public.verify_certificate_public(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_certificate_public(text) TO authenticated;