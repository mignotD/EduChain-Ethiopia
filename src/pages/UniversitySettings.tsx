import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUniversitySettings } from '@/hooks/useUniversitySettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PageTransition } from '@/components/PageTransition';
import { 
  GraduationCap, 
  ArrowLeft, 
  Save, 
  Upload, 
  Trash2, 
  Palette,
  Image,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Mail
} from 'lucide-react';

const THEMES = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Traditional diploma with serif fonts, gold accents, and decorative borders',
    preview: 'bg-gradient-to-br from-amber-50 to-amber-100/50'
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean sans-serif design with bold typography and contemporary layout',
    preview: 'bg-gradient-to-br from-slate-50 to-blue-50/50'
  },
  {
    id: 'traditional',
    label: 'Ethiopian Heritage',
    description: 'Ethiopian-inspired design with traditional patterns and cultural motifs',
    preview: 'bg-gradient-to-br from-green-50 to-amber-50'
  },
];

const UniversitySettings = () => {
  const { profile, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading, updateSettings, uploadLogo, removeLogo } = useUniversitySettings();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [primaryColor, setPrimaryColor] = useState('#1a7a5a');
  const [accentColor, setAccentColor] = useState('#d4942b');
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [emailHeaderText, setEmailHeaderText] = useState('EduChain Ethiopia');
  const [emailBodyPrefix, setEmailBodyPrefix] = useState('A new certificate has been issued:');
  const [emailFooterText, setEmailFooterText] = useState('EduChain Ethiopia — Secure Academic Credential Verification');
  const [emailPrimaryColor, setEmailPrimaryColor] = useState('#1a365d');

  useEffect(() => {
    if (!authLoading && !profile) {
      navigate('/auth');
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primary_color);
      setAccentColor(settings.accent_color);
      setSelectedTheme(settings.certificate_theme);
      setLogoPreview(settings.logo_url);
      setEmailHeaderText(settings.email_header_text || 'EduChain Ethiopia');
      setEmailBodyPrefix(settings.email_body_prefix || 'A new certificate has been issued:');
      setEmailFooterText(settings.email_footer_text || 'EduChain Ethiopia — Secure Academic Credential Verification');
      setEmailPrimaryColor(settings.email_primary_color || '#1a365d');
    }
  }, [settings]);

  const handleLogoSelect = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 2MB.');
      return;
    }

    setUploadError(null);
    setUploading(true);

    const timeout = setTimeout(() => {
      setUploading(false);
      setUploadError('Upload timed out. Try a smaller image.');
    }, 15000);

    try {
      const result = await uploadLogo(file);
      clearTimeout(timeout);
      if (result?.url) {
        setLogoPreview(result.url);
      } else if (result?.error) {
        setUploadError(result.error);
      }
    } catch (err) {
      clearTimeout(timeout);
      setUploadError('Upload failed unexpectedly');
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleLogoSelect(file);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoPreview(null);
    await removeLogo();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    const timeout = setTimeout(() => {
      setSaving(false);
      setSaveSuccess(false);
      setUploadError('Save timed out. Please try again.');
    }, 10000);

    try {
      const result = await updateSettings({
        primary_color: primaryColor,
        accent_color: accentColor,
        certificate_theme: selectedTheme as 'classic' | 'modern' | 'traditional',
        email_header_text: emailHeaderText,
        email_body_prefix: emailBodyPrefix,
        email_footer_text: emailFooterText,
        email_primary_color: emailPrimaryColor,
      });

      clearTimeout(timeout);

      if (result && !result.error) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (result?.error) {
        setUploadError(result.error);
      }
    } catch (err) {
      clearTimeout(timeout);
      setUploadError('Failed to save settings');
    }
    setSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg">University Settings</span>
              <p className="text-xs text-muted-foreground -mt-0.5">Customize your institution's look & feel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <PageTransition>
          {/* University Info */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-heading">University Information</CardTitle>
              <CardDescription>Your institution details from profile settings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="p-4 rounded-xl bg-primary/5 border">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold">{profile?.university_name || 'Not set'}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="secondary" className="text-xs font-mono">
                    Code: {profile?.university_code || '—'}
                  </Badge>
                  <Badge variant={profile?.role === 'super_admin' ? 'default' : 'secondary'} className="text-[10px]">
                    {profile?.role === 'super_admin' ? 'Super Admin' : 'University Admin'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                University Logo
              </CardTitle>
              <CardDescription>Upload your university seal or logo (PNG, JPEG, WebP — max 2MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <div className="relative group">
                      <img
                        src={logoPreview}
                        alt="University logo"
                        className="w-28 h-28 object-contain rounded-xl border bg-white p-2"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/30">
                      <Image className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Upload area */}
                <div
                  className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPEG or WebP — max 2MB</p>
                </div>
              </div>
              {uploadError && (
                <p className="mt-3 text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {uploadError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Brand Colors */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Brand Colors
              </CardTitle>
              <CardDescription>Customize colors used on certificates and your university portal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Primary Color */}
                <div className="space-y-3">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full h-10 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for headers, buttons, and certificate accents</p>
                </div>

                {/* Accent Color */}
                <div className="space-y-3">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <Input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full h-10 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for highlights, badges, and decorative elements</p>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6 p-4 rounded-xl border bg-card">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Color Preview</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge style={{ backgroundColor: primaryColor, color: '#fff' }} className="px-4 py-1.5">
                    Primary Button
                  </Badge>
                  <Badge variant="outline" style={{ borderColor: primaryColor, color: primaryColor }} className="px-4 py-1.5">
                    Outlined
                  </Badge>
                  <Badge style={{ backgroundColor: accentColor, color: '#fff' }} className="px-4 py-1.5">
                    Accent Badge
                  </Badge>
                  <div className="h-6 w-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    Hover me →<span className="ml-1" style={{ color: primaryColor }}>✓</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Theme */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Certificate Theme
              </CardTitle>
              <CardDescription>Choose the visual style for your issued certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      selectedTheme === theme.id
                        ? 'border-primary shadow-md bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:shadow-sm'
                    }`}
                  >
                    {/* Theme preview gradient */}
                    <div className={`h-20 rounded-lg mb-4 ${theme.preview} border`} />

                    {selectedTheme === theme.id && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                    )}

                    <h4 className="font-semibold text-sm mb-1">{theme.label}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{theme.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email Template */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email Template
              </CardTitle>
              <CardDescription>Customize the confirmation emails sent when certificates are issued</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Email Header Text</Label>
                  <Input
                    value={emailHeaderText}
                    onChange={(e) => setEmailHeaderText(e.target.value)}
                    placeholder="EduChain Ethiopia"
                  />
                  <p className="text-xs text-muted-foreground">Appears in the colored header bar at the top of the email</p>
                </div>

                <div className="space-y-3">
                  <Label>Issue Email Body Prefix</Label>
                  <textarea
                    value={emailBodyPrefix}
                    onChange={(e) => setEmailBodyPrefix(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="A new certificate has been issued:"
                  />
                  <p className="text-xs text-muted-foreground">The introductory paragraph shown below the title in issue emails</p>
                </div>

                <div className="space-y-3">
                  <Label>Email Footer Text</Label>
                  <Input
                    value={emailFooterText}
                    onChange={(e) => setEmailFooterText(e.target.value)}
                    placeholder="EduChain Ethiopia — Secure Academic Credential Verification"
                  />
                  <p className="text-xs text-muted-foreground">The small text at the bottom of every email</p>
                </div>

                <div className="space-y-3">
                  <Label>Email Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: emailPrimaryColor }}
                    />
                    <Input
                      type="color"
                      value={emailPrimaryColor}
                      onChange={(e) => setEmailPrimaryColor(e.target.value)}
                      className="w-full h-10 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for the email header background and call-to-action button</p>
                </div>

                {/* Email Preview */}
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Preview</p>
                  <div className="max-w-[500px] mx-auto border rounded-lg overflow-hidden shadow-sm">
                    <div className="p-4 text-center" style={{ background: emailPrimaryColor }}>
                      <h3 className="text-white text-lg font-bold m-0">{emailHeaderText || 'EduChain Ethiopia'}</h3>
                    </div>
                    <div className="p-5 border-t-0 bg-white">
                      <h4 className="font-bold m-0" style={{ color: emailPrimaryColor }}>Certificate Issued Successfully</h4>
                      <p className="text-sm text-gray-600 mt-2">{emailBodyPrefix || 'A new certificate has been issued:'}</p>
                      <div className="w-full border-collapse my-3 text-sm">
                        <div className="flex py-1.5 border-b border-gray-100">
                          <span className="text-gray-500 w-28">Student</span>
                          <span className="font-semibold">John Doe</span>
                        </div>
                        <div className="flex py-1.5 border-b border-gray-100">
                          <span className="text-gray-500 w-28">Degree</span>
                          <span className="font-semibold">Bachelor of Science</span>
                        </div>
                        <div className="flex py-1.5 border-b border-gray-100">
                          <span className="text-gray-500 w-28">Certificate ID</span>
                          <span className="font-mono text-xs">CERT-XXX-XXXX</span>
                        </div>
                      </div>
                      <div className="inline-block text-white text-sm px-5 py-2 rounded-md mt-1" style={{ background: emailPrimaryColor }}>
                        View Certificate
                      </div>
                      <p className="text-xs text-gray-400 mt-5">{emailFooterText || 'EduChain Ethiopia — Secure Academic Credential Verification'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border sticky bottom-4 backdrop-blur-sm">
            <div>
              {saveSuccess && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Settings saved successfully
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="shadow-md min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default UniversitySettings;
