import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCertificates } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  GraduationCap,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  ArrowLeft,
  Download,
  Clock,
  AlertTriangle,
  Award,
  BookOpen
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PageTransition } from '@/components/PageTransition';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts';

type DateRange = '7d' | '30d' | '90d' | 'all';

const Analytics = () => {
  const { user, profile, loading } = useAuth();
  const { certificates, fetchCertificates, isCertificateExpired } = useCertificates();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('all');

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

  const filterByDateRange = (certs: typeof certificates) => {
    if (dateRange === 'all') return certs;
    const cutoff = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    cutoff.setDate(cutoff.getDate() - days);
    return certs.filter(c => new Date(c.issued_at) >= cutoff);
  };

  const filteredCertificates = useMemo(() => filterByDateRange(certificates), [certificates, dateRange]);

  const analytics = useMemo(() => {
    if (filteredCertificates.length === 0) return null;

    const filtered = filteredCertificates;

    // Status distribution
    const statusData: Record<string, number> = { active: 0, expired: 0, revoked: 0 };
    filtered.forEach((cert) => {
      if (cert.status === 'revoked') {
        statusData.revoked++;
      } else if (isCertificateExpired(cert)) {
        statusData.expired++;
      } else {
        statusData.active++;
      }
    });

    const statusChartData = Object.entries(statusData)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        fill: status === 'active' ? 'hsl(142, 76%, 36%)' :
              status === 'expired' ? 'hsl(38, 92%, 50%)' :
              'hsl(0, 84%, 60%)'
      }));

    // Field of study distribution
    const fieldData = filtered.reduce((acc: any, cert) => {
      acc[cert.field_of_study] = (acc[cert.field_of_study] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const fieldChartData = Object.entries(fieldData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([field, count]) => ({
        degree: field.length > 22 ? field.substring(0, 22) + '...' : field,
        count
      }));

    // Monthly issuance trend
    const monthlyData = filtered.reduce((acc: any, cert) => {
      const month = new Date(cert.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyChartData = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, count]) => ({ month, count }));

    // GPA distribution
    const gpas = filtered.filter(c => c.gpa != null).map(c => c.gpa as number);
    const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null;

    const gpaRanges = [
      { range: '4.0', min: 4.0, max: 4.0, color: 'hsl(142, 76%, 36%)' },
      { range: '3.5-3.99', min: 3.5, max: 3.99, color: 'hsl(142, 70%, 50%)' },
      { range: '3.0-3.49', min: 3.0, max: 3.49, color: 'hsl(38, 92%, 50%)' },
      { range: '2.5-2.99', min: 2.5, max: 2.99, color: 'hsl(25, 95%, 53%)' },
      { range: '< 2.5', min: 0, max: 2.49, color: 'hsl(0, 84%, 60%)' },
    ];

    const gpaChartData = gpaRanges.map(r => ({
      range: r.range,
      count: gpas.filter(g => g >= r.min && g <= r.max).length,
      fill: r.color
    }));

    // Upcoming expirations (next 90 days)
    const now = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);
    const expiringSoon = filtered.filter(c =>
      !c.revoked_at &&
      c.expiry_date &&
      new Date(c.expiry_date) > now &&
      new Date(c.expiry_date) <= ninetyDays
    );

    // Recent certificates
    const recent = [...filtered].sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()).slice(0, 5);

    return {
      total: filtered.length,
      active: statusData.active,
      revoked: statusData.revoked,
      expired: statusData.expired,
      statusChartData,
      fieldChartData,
      monthlyChartData,
      gpaChartData,
      avgGpa,
      uniqueStudents: new Set(filtered.map(c => c.student_id)).size,
      expiringSoon: expiringSoon.length,
      recent,
      thisMonth: filtered.filter(c => {
        const issueDate = new Date(c.issued_at);
        const now = new Date();
        return issueDate.getMonth() === now.getMonth() &&
               issueDate.getFullYear() === now.getFullYear();
      }).length
    };
  }, [filteredCertificates, isCertificateExpired]);

  const exportCSV = () => {
    if (!analytics) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Certificates', analytics.total],
      ['Active', analytics.active],
      ['Expired', analytics.expired],
      ['Revoked', analytics.revoked],
      ['Unique Students', analytics.uniqueStudents],
      ['Avg GPA', analytics.avgGpa?.toFixed(2) || 'N/A'],
      ['Expiring Soon (90d)', analytics.expiringSoon],
      ['Issued This Month', analytics.thisMonth],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
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

              <div className="flex items-center gap-4">
            <ThemeToggle />
            {analytics && (
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            <div className="text-right">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'}>
                {profile.role === 'super_admin' ? 'Super Admin' : 'University Admin'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <PageTransition>
        {analytics ? (
          <div className="space-y-8">
            {/* Date Range & Key Metrics */}
            <div className="flex items-center justify-between">
              <ToggleGroup type="single" value={dateRange} onValueChange={(v) => v && setDateRange(v as DateRange)}>
                <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
                <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
                <ToggleGroupItem value="90d">90 days</ToggleGroupItem>
                <ToggleGroupItem value="all">All time</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total}</div>
                  <p className="text-xs text-muted-foreground">All certificates</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <GraduationCap className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analytics.active}</div>
                  <p className="text-xs text-muted-foreground">Currently valid</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.uniqueStudents}</div>
                  <p className="text-xs text-muted-foreground">Unique graduates</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">{analytics.expiringSoon}</div>
                  <p className="text-xs text-muted-foreground">Within 90 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg GPA</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgGpa?.toFixed(2) || '—'}</div>
                  <p className="text-xs text-muted-foreground">Overall average</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
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