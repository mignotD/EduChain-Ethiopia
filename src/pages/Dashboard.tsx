import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useCertificates } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GraduationCap, 
  FileText, 
  Shield, 
  Search, 
  BarChart3, 
  Settings,
  LogOut,
  Plus,
  Ban,
  CheckCircle,
  Upload,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Users
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PageTransition } from '@/components/PageTransition';
import { EmptyState } from '@/components/EmptyState';

const quickActions = [
  {
    label: 'Issue Certificate',
    icon: Plus,
    desc: 'Create a new certificate',
    action: '/issue-certificate',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Bulk Issue',
    icon: Layers,
    desc: 'Import CSV or Excel',
    action: '/bulk-issue',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    label: 'My Certificates',
    icon: FileText,
    desc: 'View & manage all certs',
    action: '/certificates',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Verify',
    icon: Search,
    desc: 'Verify any certificate',
    action: '/verify',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    desc: 'View reports & insights',
    action: '/analytics',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Settings',
    icon: Settings,
    desc: 'Branding & themes',
    action: '/settings',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
];

const Dashboard = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { logs: activityLogs, loading: logsLoading, getActionLabel } = useActivityLog();
  const { certificates, fetchLoading, isCertificateExpired } = useCertificates();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Compute certificate metrics (revoked takes precedence, then expiry by date, then active)
  const stats = useMemo(() => {
    let active = 0;
    let expired = 0;
    let revoked = 0;
    let thisMonth = 0;
    const now = new Date();

    certificates.forEach((cert) => {
      if (cert.status === 'revoked') {
        revoked++;
      } else if (isCertificateExpired(cert)) {
        expired++;
      } else {
        active++;
      }

      const issued = new Date(cert.issued_at);
      if (issued.getMonth() === now.getMonth() && issued.getFullYear() === now.getFullYear()) {
        thisMonth++;
      }
    });

    return { total: certificates.length, active, expired, revoked, thisMonth };
  }, [certificates, isCertificateExpired]);

  const metricCards = [
    { label: 'Total Certificates', value: stats.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active', value: stats.active, icon: GraduationCap, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Expired', value: stats.expired, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Revoked', value: stats.revoked, icon: Ban, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

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
              <span className="font-heading font-bold text-lg">EduChain Ethiopia</span>
              <p className="text-xs text-muted-foreground -mt-0.5">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:block text-right text-sm">
              <p className="font-medium leading-tight">{profile.full_name}</p>
              <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                {profile.role === 'super_admin' ? 'Super Admin' : 'University Admin'}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <PageTransition>
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold mb-1">Welcome back, {profile.full_name.split(' ')[0]}!</h2>
            <p className="text-muted-foreground text-sm">
              {profile.university_name || 'Manage your university\'s academic credentials'}
            </p>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {metricCards.map((metric) => (
              <div key={metric.label} className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${metric.bg} ${metric.color}`}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                  {metric.label === 'Total Certificates' && stats.thisMonth > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      +{stats.thisMonth} this month
                    </Badge>
                  )}
                </div>
                {fetchLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className={`text-3xl font-heading font-extrabold ${metric.color}`}>{metric.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {quickActions.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.action)}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group text-center"
                >
                  <div className={`p-2.5 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-200`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground -mt-1">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Profile Setup Notice */}
          {(!profile.university_name || !profile.university_code) && (
            <Card className="mb-8 border-accent/50 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Complete Your Profile</h4>
                      <p className="text-sm text-muted-foreground">Add your university details to start issuing certificates.</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('/profile')}>
                    Setup Now
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-heading">Recent Activity</CardTitle>
                  <CardDescription>Your latest certificate management activities</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Latest 10
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading activity...</p>
                </div>
              ) : activityLogs.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No recent activity"
                  description="Start by issuing your first certificate"
                  action={{ label: 'Issue Certificate', onClick: () => navigate('/issue-certificate') }}
                />
              ) : (
                <div className="space-y-1">
                  {activityLogs.slice(0, 10).map((log) => {
                    const ActionIcon = 
                      log.action === 'revoked' ? Ban :
                      log.action === 'issued' ? CheckCircle :
                      log.action === 'bulk_issued' ? Upload :
                      log.action === 'verified' ? Search :
                      FileText;
                    
                    const iconClass = 
                      log.action === 'revoked' ? 'text-destructive bg-destructive/10' :
                      log.action === 'issued' ? 'text-success bg-success/10' :
                      log.action === 'bulk_issued' ? 'text-primary bg-primary/10' :
                      'text-muted-foreground bg-muted';

                    return (
                      <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`p-1.5 rounded-full ${iconClass}`}>
                          <ActionIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{getActionLabel(log.action)}</p>
                          {log.certificate_id && (
                            <p className="text-xs text-muted-foreground truncate">
                              {log.certificate_id}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                  <Separator className="my-2" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-muted-foreground"
                    onClick={() => navigate('/certificates')}
                  >
                    View all certificates
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </PageTransition>
      </main>
    </div>
  );
};

export default Dashboard;
