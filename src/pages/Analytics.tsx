import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCertificates } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  GraduationCap, 
  BarChart3, 
  TrendingUp,
  Users,
  FileText,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Analytics = () => {
  const { user, profile, loading } = useAuth();
  const { certificates, fetchCertificates } = useCertificates();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && profile) {
      fetchCertificates();
    }
  }, [user, profile, fetchCertificates]);

  useEffect(() => {
    if (certificates.length > 0) {
      calculateAnalytics();
    }
  }, [certificates]);

  const calculateAnalytics = () => {
    // Status distribution
    const statusData = certificates.reduce((acc: any, cert) => {
      acc[cert.status] = (acc[cert.status] || 0) + 1;
      return acc;
    }, {});

    const statusChartData = Object.entries(statusData).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      fill: status === 'active' ? 'hsl(var(--primary))' : 
            status === 'revoked' ? 'hsl(var(--destructive))' : 
            'hsl(var(--muted))'
    }));

    // Degrees distribution
    const degreeData = certificates.reduce((acc: any, cert) => {
      acc[cert.degree] = (acc[cert.degree] || 0) + 1;
      return acc;
    }, {});

    const degreeChartData = Object.entries(degreeData)
      .slice(0, 5)
      .map(([degree, count]) => ({
        degree: degree.length > 20 ? degree.substring(0, 20) + '...' : degree,
        count
      }));

    // Monthly issuance trend
    const monthlyData = certificates.reduce((acc: any, cert) => {
      const month = new Date(cert.issued_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const monthlyChartData = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6)
      .map(([month, count]) => ({
        month,
        count
      }));

    setAnalytics({
      total: certificates.length,
      active: statusData.active || 0,
      revoked: statusData.revoked || 0,
      pending: statusData.pending || 0,
      statusChartData,
      degreeChartData,
      monthlyChartData,
      uniqueStudents: new Set(certificates.map(c => c.student_id)).size,
      thisMonth: certificates.filter(c => {
        const issueDate = new Date(c.issued_at);
        const now = new Date();
        return issueDate.getMonth() === now.getMonth() && 
               issueDate.getFullYear() === now.getFullYear();
      }).length
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Analytics</h1>
                <p className="text-sm text-muted-foreground">Certificate metrics and insights</p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium">{profile.full_name}</p>
            <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'}>
              {profile.role === 'super_admin' ? 'Super Admin' : 'University Admin'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {analytics ? (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Certificates</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analytics.active}</div>
                  <p className="text-xs text-muted-foreground">Currently valid</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.uniqueStudents}</div>
                  <p className="text-xs text-muted-foreground">Individual graduates</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.thisMonth}</div>
                  <p className="text-xs text-muted-foreground">Certificates issued</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Certificate Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Status</CardTitle>
                  <CardDescription>Distribution of certificate statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      active: { label: "Active", color: "hsl(var(--primary))" },
                      revoked: { label: "Revoked", color: "hsl(var(--destructive))" },
                      pending: { label: "Pending", color: "hsl(var(--muted))" }
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics.statusChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Top Degrees */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Degrees</CardTitle>
                  <CardDescription>Most issued degree types</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: "Count", color: "hsl(var(--primary))" }
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.degreeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="degree" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Issuance Trend</CardTitle>
                <CardDescription>Certificates issued over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: { label: "Certificates", color: "hsl(var(--primary))" }
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground text-center mb-4">
                Issue some certificates to see analytics data
              </p>
              <Button onClick={() => navigate('/issue-certificate')}>
                Issue First Certificate
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Analytics;