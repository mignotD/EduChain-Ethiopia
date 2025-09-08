-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('super_admin', 'university_admin');

-- Create enum for certificate status
CREATE TYPE public.certificate_status AS ENUM ('active', 'revoked', 'pending');

-- Create profiles table for user management
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'university_admin',
    university_name TEXT,
    university_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create certificates table
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT NOT NULL,
    gpa DECIMAL(3,2),
    graduation_date DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    university_name TEXT NOT NULL,
    university_code TEXT NOT NULL,
    issued_by UUID REFERENCES public.profiles(user_id) NOT NULL,
    pdf_url TEXT,
    qr_code_data TEXT,
    status certificate_status NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- RLS Policies for certificates
CREATE POLICY "University admins can view their university's certificates" 
ON public.certificates 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND (role = 'super_admin' OR university_code = certificates.university_code)
    )
);

CREATE POLICY "University admins can insert certificates for their university" 
ON public.certificates 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND (role = 'super_admin' OR university_code = certificates.university_code)
        AND auth.uid() = certificates.issued_by
    )
);

CREATE POLICY "University admins can update their university's certificates" 
ON public.certificates 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND (role = 'super_admin' OR university_code = certificates.university_code)
    )
);

-- Create public policy for certificate verification (read-only access)
CREATE POLICY "Anyone can verify certificates by ID" 
ON public.certificates 
FOR SELECT 
USING (true);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON public.certificates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique certificate ID
CREATE OR REPLACE FUNCTION public.generate_certificate_id()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Create indexes for better performance
CREATE INDEX idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_university_code ON public.certificates(university_code);
CREATE INDEX idx_certificates_status ON public.certificates(status);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_university_code ON public.profiles(university_code);