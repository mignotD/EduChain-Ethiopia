import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCertificates } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, GraduationCap, FileText, Eye, Check, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CertificateForm {
  studentName: string;
  studentId: string;
  degree: string;
  fieldOfStudy: string;
  graduationDate: Date | undefined;
  gpa: string;
  metadata: {
    honors?: string;
    additionalInfo?: string;
  };
}

const IssueCertificate = () => {
  const { profile } = useAuth();
  const { issueCertificate, loading } = useCertificates();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<CertificateForm>({
    studentName: '',
    studentId: '',
    degree: '',
    fieldOfStudy: '',
    graduationDate: undefined,
    gpa: '',
    metadata: {}
  });

  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Enhanced validation function
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!form.studentName.trim()) errors.push('Student name is required');
    if (!form.studentId.trim()) errors.push('Student ID is required');
    if (!form.degree) errors.push('Degree is required');
    if (!form.fieldOfStudy.trim()) errors.push('Field of study is required');
    if (!form.graduationDate) errors.push('Graduation date is required');
    
    // Validate student name (only letters, spaces, and common punctuation)
    if (form.studentName.trim() && !/^[a-zA-Z\s\-'.]+$/.test(form.studentName.trim())) {
      errors.push('Student name contains invalid characters');
    }
    
    // Validate student ID (alphanumeric with possible dashes/underscores)
    if (form.studentId.trim() && !/^[a-zA-Z0-9\-_]+$/.test(form.studentId.trim())) {
      errors.push('Student ID contains invalid characters');
    }
    
    // Validate GPA if provided
    if (form.gpa && (isNaN(parseFloat(form.gpa)) || parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4)) {
      errors.push('GPA must be a number between 0 and 4');
    }
    
    // Validate graduation date (shouldn't be in the future)
    if (form.graduationDate && form.graduationDate > new Date()) {
      errors.push('Graduation date cannot be in the future');
    }
    
    return errors;
  };

  const handlePreview = () => {
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setShowPreview(true);
    } else {
      toast({
        title: "Validation Error",
        description: `Please fix ${errors.length} error(s) before previewing.`,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!profile?.university_name || !profile?.university_code) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your university information before issuing certificates.",
        variant: "destructive"
      });
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: `Please fix ${errors.length} error(s) before submitting.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const certificateData = {
        student_name: form.studentName.trim(),
        student_id: form.studentId.trim(),
        degree: form.degree,
        field_of_study: form.fieldOfStudy.trim(),
        graduation_date: form.graduationDate!.toISOString().split('T')[0],
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        university_name: profile.university_name,
        university_code: profile.university_code,
        honors: form.metadata.honors?.trim() || undefined
      };

      await issueCertificate(certificateData);
      
      toast({
        title: "Certificate Issued Successfully",
        description: `Certificate for ${form.studentName} has been created and is ready for verification.`
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Certificate issuance error:', error);
      toast({
        title: "Error",
        description: "Failed to issue certificate. Please check your information and try again.",
        variant: "destructive"
      });
    }
  };

  const degreeOptions = [
    'Bachelor of Science',
    'Bachelor of Arts',
    'Bachelor of Engineering',
    'Master of Science',
    'Master of Arts',
    'Master of Business Administration',
    'Doctor of Philosophy',
    'Doctor of Medicine',
    'Doctor of Engineering'
  ];

  // Certificate Preview Component
  const CertificatePreview = () => (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-blue-900">
          {profile?.university_name}
        </CardTitle>
        <CardDescription className="text-lg font-semibold text-blue-700">
          Certificate of Graduation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-lg">This is to certify that</p>
        <p className="text-2xl font-bold text-blue-900">{form.studentName}</p>
        <p className="text-lg">
          has successfully completed the requirements for the degree of
        </p>
        <p className="text-xl font-semibold text-blue-800">{form.degree}</p>
        <p className="text-lg">in {form.fieldOfStudy}</p>
        <p className="text-md">
          Graduated on {form.graduationDate ? format(form.graduationDate, "MMMM d, yyyy") : ""}
        </p>
        {form.gpa && (
          <p className="text-md">
            with a Grade Point Average of {form.gpa}
          </p>
        )}
        {form.metadata.honors && (
          <p className="text-md font-semibold text-blue-700">
            {form.metadata.honors}
          </p>
        )}
        <div className="pt-4">
          <Badge variant="secondary">Student ID: {form.studentId}</Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Issue New Certificate</h1>
                <p className="text-sm text-muted-foreground">
                  Create academic credential for {profile?.university_name}
                </p>
              </div>
            </div>
            {!showPreview && (
              <Button variant="outline" onClick={handlePreview} disabled={loading}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showPreview ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Certificate Preview</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Edit Details
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  <Check className="h-4 w-4 mr-2" />
                  {loading ? 'Issuing...' : 'Issue Certificate'}
                </Button>
              </div>
            </div>
            
            <CertificatePreview />
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please review all details carefully. Once issued, certificates cannot be easily modified.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Certificate Details
              </CardTitle>
              <CardDescription>
                Fill in the student and academic information for the certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Please fix the following errors:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Student Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Full Name *</Label>
                    <Input
                      id="studentName"
                      placeholder="Enter student's full name"
                      value={form.studentName}
                      onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID *</Label>
                    <Input
                      id="studentId"
                      placeholder="Enter student ID"
                      value={form.studentId}
                      onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree *</Label>
                    <Select value={form.degree} onValueChange={(value) => setForm({ ...form, degree: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree type" />
                      </SelectTrigger>
                      <SelectContent>
                        {degreeOptions.map((degree) => (
                          <SelectItem key={degree} value={degree}>
                            {degree}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                    <Input
                      id="fieldOfStudy"
                      placeholder="e.g., Computer Science"
                      value={form.fieldOfStudy}
                      onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Graduation Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.graduationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.graduationDate ? format(form.graduationDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.graduationDate}
                          onSelect={(date) => setForm({ ...form, graduationDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gpa">GPA (Optional)</Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      placeholder="e.g., 3.75"
                      value={form.gpa}
                      onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="honors">Honors/Distinctions (Optional)</Label>
                  <Input
                    id="honors"
                    placeholder="e.g., Magna Cum Laude, With Distinction"
                    value={form.metadata.honors || ''}
                    onChange={(e) => setForm({ 
                      ...form, 
                      metadata: { ...form.metadata, honors: e.target.value }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any additional information about the certificate"
                    value={form.metadata.additionalInfo || ''}
                    onChange={(e) => setForm({ 
                      ...form, 
                      metadata: { ...form.metadata, additionalInfo: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
              </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t flex gap-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1" 
                    onClick={handlePreview}
                    disabled={loading}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Certificate
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1" 
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Issuing...' : 'Issue Certificate'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default IssueCertificate;