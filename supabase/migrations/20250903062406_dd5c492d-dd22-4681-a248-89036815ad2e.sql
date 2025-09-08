-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'university_admin' CHECK (role IN ('super_admin', 'university_admin')),
  university_name TEXT,
  university_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id TEXT NOT NULL UNIQUE DEFAULT generate_certificate_id(),
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  graduation_date DATE NOT NULL,
  gpa DECIMAL(3,2),
  honors TEXT,
  university_name TEXT NOT NULL,
  university_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'pending')),
  qr_code TEXT,
  issued_by UUID NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_university_code ON public.certificates(university_code);
CREATE INDEX idx_certificates_issued_by ON public.certificates(issued_by);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_university_code ON public.profiles(university_code);

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for certificates
CREATE POLICY "Users can view certificates from their university" ON public.certificates
  FOR SELECT USING (
    university_code = (
      SELECT profiles.university_code 
      FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert certificates for their university" ON public.certificates
  FOR INSERT WITH CHECK (
    auth.uid() = issued_by AND
    university_code = (
      SELECT profiles.university_code 
      FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update certificates from their university" ON public.certificates
  FOR UPDATE USING (
    university_code = (
      SELECT profiles.university_code 
      FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Create public policy for certificate verification
CREATE POLICY "Anyone can verify certificates by ID" ON public.certificates
  FOR SELECT USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();