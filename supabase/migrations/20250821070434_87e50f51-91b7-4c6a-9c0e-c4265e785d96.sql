-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        'university_admin'
    );
    RETURN NEW;
END;
$$;

-- Fix update function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix generate certificate ID function search path
CREATE OR REPLACE FUNCTION public.generate_certificate_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate format: EC-YYYY-XXXXXX (EduChain + Year + 6 random chars)
        new_id := 'EC-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                 UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Check if ID already exists
        SELECT EXISTS(SELECT 1 FROM public.certificates WHERE certificate_id = new_id) INTO exists_check;
        
        -- Exit loop if unique
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$;