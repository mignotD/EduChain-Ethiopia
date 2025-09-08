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
  CheckCircle
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Secure Issuance',
      description: 'Universities can securely issue digital certificates with unique IDs and QR codes.'
    },
    {
      icon: QrCode,
      title: 'QR Code Verification',
      description: 'Instant verification through QR code scanning or certificate ID lookup.'
    },
    {
      icon: FileCheck,
      title: 'Digital Certificates',
      description: 'Professional PDF certificates with embedded security features.'
    },
    {
      icon: Globe,
      title: 'Global Recognition',
      description: 'International employers and institutions can verify credentials instantly.'
    }
  ];

  const benefits = [
    'Eliminate fake academic credentials',
    'Instant verification process',
    'Reduce manual paperwork',
    'International recognition',
    'Secure blockchain-like verification',
    'Cost-effective solution'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">EduChain Ethiopia</h1>
              <p className="text-xs text-muted-foreground">Academic Credential Verification</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => navigate('/verify')}>
              <Search className="h-4 w-4 mr-2" />
              Verify Certificate
            </Button>
            <Button onClick={() => navigate('/auth')}>
              <Shield className="h-4 w-4 mr-2" />
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 text-center">
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Secure Academic
            <br />
            Credential Verification
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            EduChain Ethiopia provides a centralized platform for universities to issue, 
            store, and verify academic certificates digitally, eliminating fraud and 
            ensuring instant global recognition.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/verify')} className="group">
              <Search className="h-5 w-5 mr-2" />
              Verify a Certificate
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              <Shield className="h-5 w-5 mr-2" />
              University Access
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How EduChain Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our secure platform streamlines the entire certificate lifecycle from issuance to verification
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary w-fit">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose EduChain Ethiopia?</h2>
              <p className="text-muted-foreground mb-6">
                Transform how academic credentials are managed in Ethiopia with our 
                secure, efficient, and globally recognized verification system.
              </p>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button onClick={() => navigate('/auth')}>
                  Get Started as University
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
            
            <Card className="p-8">
              <div className="text-center">
                <div className="p-4 rounded-full bg-primary text-primary-foreground w-fit mx-auto mb-4">
                  <QrCode className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">Instant Verification</h3>
                <p className="text-muted-foreground mb-6">
                  Employers and institutions can verify any certificate in seconds 
                  using our QR code system or certificate ID lookup.
                </p>
                <Button variant="outline" onClick={() => navigate('/verify')}>
                  Try Verification Now
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Eliminate Certificate Fraud?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join the growing network of Ethiopian universities using EduChain to 
            issue secure, verifiable academic credentials.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
              Register Your University
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/verify')}>
              Verify a Certificate
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">EduChain Ethiopia</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Securing Ethiopia's Academic Future through Digital Innovation
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
