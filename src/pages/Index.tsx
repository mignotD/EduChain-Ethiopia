import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Shield, 
  Search, 
  QrCode, 
  FileCheck, 
  Globe,
  ArrowRight,
  CheckCircle,
  Users,
  Sparkles,
  ScrollText,
  Building2,
  ExternalLink
} from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Tamper-Proof Issuance',
      description: 'Each certificate carries a unique blockchain-anchored ID and encrypted QR code, making forgery impossible.',
      stat: '100%',
      statLabel: 'Fraud elimination'
    },
    {
      icon: QrCode,
      title: 'Instant Verification',
      description: 'Employers verify credentials in seconds — scan a QR code or enter a certificate ID. No accounts needed.',
      stat: '3s',
      statLabel: 'Average verification time'
    },
    {
      icon: Building2,
      title: 'Multi-University Platform',
      description: 'Ethiopian universities manage all graduate credentials from one centralized, secure platform.',
      stat: 'Unlimited',
      statLabel: 'University support'
    },
    {
      icon: Globe,
      title: 'Global Recognition',
      description: 'International employers, embassies, and institutions verify Ethiopian credentials instantly worldwide.',
      stat: '24/7',
      statLabel: 'Global availability'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Certificates Issued' },
    { value: '50+', label: 'Universities' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.8/5', label: 'User Rating' },
  ];

  const benefits = [
    'Eliminate fake academic credentials permanently',
    'Instant global verification for employers',
    'Reduce administrative overhead by 80%',
    'International recognition for Ethiopian graduates',
    'Secure blockchain-anchored verification',
    'Cost-effective compared to paper systems'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-heading font-bold text-lg text-primary">EduChain Ethiopia</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/verify')} className="hidden sm:flex">
              <Search className="h-4 w-4 mr-1.5" />
              Verify
            </Button>
            <Button size="sm" onClick={() => navigate('/auth')}>
              <Shield className="h-4 w-4 mr-1.5" />
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <PageTransition>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
        <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium tracking-wide">
              <Sparkles className="h-3 w-3 mr-1.5 text-accent" />
              Ethiopia's Trusted Credential Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Secure Academic
              </span>
              <br />
              <span className="text-foreground">
                Credential Verification
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              A centralized platform for Ethiopian universities to issue, 
              store, and verify academic certificates. Eliminate fraud with 
              blockchain-anchored credentials verified globally in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/verify')} className="group h-12 px-8 text-base shadow-md hover:shadow-lg">
                <Search className="h-5 w-5 mr-2" />
                Verify a Certificate
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="h-12 px-8 text-base">
                <Shield className="h-5 w-5 mr-2" />
                University Access
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Stats Bar */}
      <section className="border-y bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-heading font-extrabold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">Platform Features</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">How EduChain Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From issuance to verification — every step is secure, fast, and transparent.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="feature-card group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-heading font-bold text-primary">{feature.stat}</p>
                </div>
                <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                <p className="text-xs text-primary font-medium mt-3">{feature.statLabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits + Verification Card */}
      <section className="py-24 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 px-4 py-1.5">Why Choose Us</Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                Built for Ethiopian
                <br />
                <span className="text-primary">Higher Education</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                EduChain Ethiopia transforms how academic credentials are managed across the nation. 
                No more fake certificates, no more verification delays, no more administrative burden.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-primary/10 text-primary mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span className="text-sm leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-10">
                <Button size="lg" onClick={() => navigate('/auth')} className="h-12 px-8 text-base shadow-md">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-dots-pattern pointer-events-none" />
              <div className="relative rounded-xl border gradient-border p-8 bg-card">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary text-primary-foreground w-fit mx-auto mb-5 shadow-md">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-3">Try It Now</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Enter a certificate ID or scan any EduChain QR code. 
                    Results appear instantly — no login required.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button size="lg" onClick={() => navigate('/verify')} className="h-12 text-base">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Verify a Certificate
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => navigate('/student')} className="h-12 text-base">
                      <Users className="h-4 w-4 mr-2" />
                      Student Portal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-diagonal-lines pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5">Get Started</Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 max-w-3xl mx-auto leading-tight">
            Ready to Transform
            <br />
            <span className="text-primary">Credential Management?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join the growing network of Ethiopian universities securing their graduates' futures.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="h-12 px-8 text-base shadow-md">
              <GraduationCap className="h-5 w-5 mr-2" />
              Register Your University
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/verify')} className="h-12 px-8 text-base">
              <Search className="h-5 w-5 mr-2" />
              Verify a Certificate
            </Button>
          </div>
        </div>
      </section>
      </PageTransition>

      {/* Footer */}
      <footer className="border-t py-10 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-heading font-bold text-primary">EduChain Ethiopia</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Securing Ethiopia's Academic Future through Digital Innovation
            </p>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
