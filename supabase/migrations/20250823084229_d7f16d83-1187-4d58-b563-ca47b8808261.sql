-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic super admin policy that causes recursion
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Create a security definer function to check super admin role safely
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND profiles.role = 'super_admin'
  );
$$;

-- Recreate super admin policy using the security definer function
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Also create an update policy for super admins
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));