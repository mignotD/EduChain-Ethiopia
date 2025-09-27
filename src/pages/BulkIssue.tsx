import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCertificates } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertTriangle,
  Download, GraduationCap, Loader2, Table
} from 'lucide-react';
import { parseSpreadsheet, ParsedRow, ParseResult } from '@/utils/csvParser';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Step = 'upload' | 'preview' | 'confirm' | 'result';

const BulkIssue = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { bulkIssueCertificates, loading: issuing } = useCertificates();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [issueResult, setIssueResult] = useState<{ succeeded: number; failed: number; errors: { row: number; error: string }[] } | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    navigate('/auth');
    return null;
  }

  const handleFileSelect = async (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please upload a .csv or .xlsx file');
      return;
    }

    try {
      const result = await parseSpreadsheet(file);
      setParseResult(result);
      // Auto-select all valid rows
      setSelectedRows(result.rows.filter(r => r.errors.length === 0).map(r => r.rowNumber));
      setStep('preview');
      toast.success(`Loaded ${result.totalRows} rows (${result.validRows} valid, ${result.errorRows} with errors)`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const toggleRow = (rowNumber: number) => {
    setSelectedRows(prev =>
      prev.includes(rowNumber)
        ? prev.filter(r => r !== rowNumber)
        : [...prev, rowNumber]
    );
  };

  const handleIssue = async () => {
    if (!parseResult) return;

    const rowsToIssue = parseResult.rows
      .filter(r => selectedRows.includes(r.rowNumber) && r.errors.length === 0)
      .map(({ student_name, student_id, degree, field_of_study, graduation_date, gpa, honors, expiry_date }) => ({
        student_name,
        student_id,
        degree,
        field_of_study,
        graduation_date,
        gpa: gpa ?? null,
        honors: honors ?? undefined,
        expiry_date: expiry_date ?? null,
      }));

    if (rowsToIssue.length === 0) {
      toast.error('No valid rows selected');
      return;
    }

    setStep('confirm');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 300);

    try {
      const result = await bulkIssueCertificates(rowsToIssue);
      clearInterval(interval);
      setProgress(100);
      setIssueResult(result);
      setStep('result');

      if (result.succeeded > 0) {
        toast.success(`Successfully issued ${result.succeeded} certificate(s)`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} certificate(s) failed`);
      }
    } catch (err) {
      clearInterval(interval);
      toast.error('Bulk issuance failed');
      setStep('preview');
    }
  };

  const downloadErrorReport = () => {
    if (!issueResult || issueResult.errors.length === 0) return;
    const csv = [
      'Row,Error',
      ...issueResult.errors.map(e => `${e.row},"${e.error}"`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-issue-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Bulk Certificate Issuance</h1>
              <p className="text-sm text-muted-foreground">
                Issue multiple certificates at once using a CSV or Excel file
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['upload', 'preview', 'confirm', 'result'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-primary text-primary-foreground' :
                ['upload', 'preview', 'confirm', 'result'].indexOf(step) > i ? 'bg-success text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {['upload', 'preview', 'confirm', 'result'].indexOf(step) > i ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
                {s === 'upload' ? 'Upload' : s === 'preview' ? 'Preview' : s === 'confirm' ? 'Issue' : 'Result'}
              </span>
              {i < 3 && <Separator className="w-8 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Spreadsheet
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with student certificate data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports .csv and .xlsx files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <Button variant="outline" type="button">
                  <Download className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Required Columns:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1"><Badge variant="outline" className="text-xs">student_name</Badge> Full name</div>
                  <div className="flex items-center gap-1"><Badge variant="outline" className="text-xs">student_id</Badge> Student ID</div>
                  <div className="flex items-center gap-1"><Badge variant="outline" className="text-xs">degree</Badge> Degree type</div>
                  <div className="flex items-center gap-1"><Badge variant="outline" className="text-xs">field_of_study</Badge> Field of study</div>
                  <div className="flex items-center gap-1"><Badge variant="outline" className="text-xs">graduation_date</Badge> Graduation date</div>
                  <div className="flex items-center gap-1"><Badge variant="outline" className="text-xs">gpa</Badge> GPA (optional)</div>
                  <div className="flex items-center gap-1"><Badge variant="outline" className="text-xs">honors</Badge> Honors (optional)</div>
                  <div className="flex items-center gap-1"><Badge variant="outline" className="text-xs">expiry_date</Badge> Expiry (optional)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && parseResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parseResult.totalRows}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-success">Valid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{parseResult.validRows}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-destructive">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{parseResult.errorRows}</div>
                </CardContent>
              </Card>
            </div>

            {/* Column Mapping */}
            {Object.keys(parseResult.columnMapping).length > 0 && (
              <Alert>
                <Table className="h-4 w-4" />
                <AlertDescription>
                  Detected columns: {Object.entries(parseResult.columnMapping)
                    .map(([field, header]) => `${header} → ${field}`).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {/* Rows Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Data Preview</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {selectedRows.length} row(s) selected for issuance
                  </span>
                </CardTitle>
                <CardDescription>
                  Review the data below. Rows with errors are highlighted. Select/deselect rows to issue.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-2 w-8"></th>
                      <th className="pb-2 pr-2">#</th>
                      <th className="pb-2 pr-2">Name</th>
                      <th className="pb-2 pr-2">ID</th>
                      <th className="pb-2 pr-2">Degree</th>
                      <th className="pb-2 pr-2">Field</th>
                      <th className="pb-2 pr-2">Grad Date</th>
                      <th className="pb-2 pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.rows.slice(0, 100).map((row) => {
                      const hasErrors = row.errors.length > 0;
                      const isSelected = selectedRows.includes(row.rowNumber);
                      return (
                        <tr
                          key={row.rowNumber}
                          className={`border-b text-sm ${
                            hasErrors ? 'bg-destructive/5' :
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          <td className="py-2 pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={hasErrors}
                              onChange={() => toggleRow(row.rowNumber)}
                              className="rounded"
                            />
                          </td>
                          <td className="py-2 pr-2 text-muted-foreground">{row.rowNumber}</td>
                          <td className="py-2 pr-2">{row.student_name || '-'}</td>
                          <td className="py-2 pr-2">{row.student_id || '-'}</td>
                          <td className="py-2 pr-2">{row.degree || '-'}</td>
                          <td className="py-2 pr-2">{row.field_of_study || '-'}</td>
                          <td className="py-2 pr-2">{row.graduation_date || '-'}</td>
                          <td className="py-2 pr-2">
                            {hasErrors ? (
                              <span className="text-destructive text-xs" title={row.errors.join('; ')}>
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {row.errors.length} error(s)
                              </span>
                            ) : (
                              <span className="text-success text-xs">Valid</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {parseResult.rows.length > 100 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Showing first 100 of {parseResult.rows.length} rows
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Errors Detail */}
            {parseResult.errorRows > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Row Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm max-h-40 overflow-auto">
                    {parseResult.rows.filter(r => r.errors.length > 0).map(row => (
                      <div key={row.rowNumber} className="flex gap-2">
                        <span className="font-medium text-muted-foreground w-12">Row {row.rowNumber}:</span>
                        <span className="text-destructive">{row.errors.join('; ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                Upload Different File
              </Button>
              <Button
                onClick={handleIssue}
                disabled={selectedRows.length === 0}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Issue {selectedRows.length} Certificate(s)
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm / Issuing */}
        {step === 'confirm' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Issuing Certificates...
              </CardTitle>
              <CardDescription>
                Please wait while certificates are being created
              </CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <Progress value={progress} className="h-3" />
              <p className="text-center text-sm text-muted-foreground mt-4">
                {progress < 100 ? 'Processing...' : 'Finalizing...'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Result */}
        {step === 'result' && issueResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Succeeded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{issueResult.succeeded}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Failed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{issueResult.failed}</div>
                </CardContent>
              </Card>
            </div>

            {issueResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-destructive">Error Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm max-h-40 overflow-auto">
                    {issueResult.errors.map((err, i) => (
                      <div key={i} className="text-destructive">
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4" onClick={downloadErrorReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => { setStep('upload'); setParseResult(null); setIssueResult(null); }} className="flex-1">
                Issue Another Batch
              </Button>
              <Button onClick={() => navigate('/certificates')} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                View Certificates
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BulkIssue;
