-- Insert missing profile for existing user
INSERT INTO public.profiles (user_id, email, full_name, role)
VALUES (
  '10361533-fb66-4511-b242-c73abf0c7d28',
  'mignot.dansa@astu.edu.et',
  'Mignot Dansa',
  'university_admin'
);

-- Create a function to handle existing users without profiles
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profiles for users who don't have them
  INSERT INTO public.profiles (user_id, email, full_name, role)
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
    'university_admin'
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  WHERE p.user_id IS NULL;
END;
$$;

-- Execute the function to create missing profiles
SELECT public.create_missing_profiles();