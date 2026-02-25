'use client';

import { useState } from 'react';
import { usePatients } from '@/hooks';
import { useDailyReportList, useDailySummary, useGenerateDailyReport } from '@/hooks';
import { usePatientAdmissions } from '@/hooks';
import type { DailyReport, DailySummary, AlertSeverity } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  LegacySelect,
  Skeleton,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui';
import {
  FileBarChart,
  RefreshCw,
  Activity,
  Droplets,
  Pill,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react';

function formatToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function severityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'destructive';
    case 'HIGH':
      return 'destructive';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export default function DailyReportsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatToday());
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: admissions } = usePatientAdmissions(selectedPatientId);
  const { data: reportList, isLoading: listLoading } = useDailyReportList(selectedAdmissionId, {
    limit: 20,
  });
  const { data: liveSummary, isLoading: summaryLoading } = useDailySummary(
    selectedAdmissionId,
    selectedDate,
  );
  const generateReport = useGenerateDailyReport(selectedAdmissionId);

  const patientOptions = [
    { value: '', label: 'Select Patient' },
    ...(patients?.data?.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.patientNumber})`,
    })) ?? []),
  ];

  const admissionOptions = [
    { value: '', label: 'Select Admission' },
    ...(admissions?.map((a) => ({
      value: a.id,
      label: `${a.admissionDate} - ${a.status}`,
    })) ?? []),
  ];

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatientId(e.target.value);
    setSelectedAdmissionId('');
    setSelectedReport(null);
    setViewMode('list');
  };

  const handleAdmissionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAdmissionId(e.target.value);
    setSelectedReport(null);
    setViewMode('list');
  };

  const handleGenerate = () => {
    if (!selectedAdmissionId || !selectedDate) return;
    generateReport.mutate(selectedDate);
  };

  const handleViewReport = (report: DailyReport) => {
    setSelectedReport(report);
    setViewMode('detail');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {viewMode === 'detail' && (
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileBarChart className="h-6 w-6" />
              Daily Reports
            </h1>
            <p className="text-muted-foreground mt-1">View and generate daily patient reports</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              {patientsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <LegacySelect
                  options={patientOptions}
                  value={selectedPatientId}
                  onChange={handlePatientChange}
                />
              )}
            </div>
            <div className="flex-1">
              <LegacySelect
                options={admissionOptions}
                value={selectedAdmissionId}
                onChange={handleAdmissionChange}
              />
            </div>
            <div className="w-full md:w-48">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedAdmissionId || !selectedDate || generateReport.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${generateReport.isPending ? 'animate-spin' : ''}`}
              />
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      {!selectedAdmissionId ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileBarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a patient and admission to view daily reports.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'detail' && selectedReport ? (
        <ReportDetailView report={selectedReport} />
      ) : (
        <div className="space-y-6">
          {/* Live Summary */}
          {selectedDate && (
            <LiveSummaryCard summary={liveSummary} loading={summaryLoading} date={selectedDate} />
          )}

          {/* Report List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report History</CardTitle>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : reportList?.data && reportList.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vitals</TableHead>
                      <TableHead>I/O Balance</TableHead>
                      <TableHead>Medications</TableHead>
                      <TableHead>Alerts</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportList.data.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.reportDate}</TableCell>
                        <TableCell>
                          {report.patientStatus && (
                            <Badge
                              variant={
                                report.patientStatus === 'CRITICAL'
                                  ? 'destructive'
                                  : report.patientStatus === 'DECLINING'
                                    ? 'destructive'
                                    : report.patientStatus === 'STABLE'
                                      ? 'secondary'
                                      : 'outline'
                              }
                            >
                              {report.patientStatus}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.vitalsSummary
                            ? `${report.vitalsSummary.measurementCount} measurements`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {report.ioBalance != null
                            ? `${report.ioBalance > 0 ? '+' : ''}${report.ioBalance} mL`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {report.medicationsGiven != null
                            ? `${report.medicationsGiven} given`
                            : '-'}
                          {report.medicationsHeld != null && report.medicationsHeld > 0 && (
                            <span className="text-yellow-600 ml-1">
                              ({report.medicationsHeld} held)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.alerts?.length ? (
                            <Badge variant="destructive">{report.alerts.length}</Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No reports generated yet for this admission.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function LiveSummaryCard({
  summary,
  loading,
  date,
}: {
  summary: DailySummary | undefined;
  loading: boolean;
  date: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Live Summary for {date}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vitals Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Vitals</span>
            </div>
            {summary.vitalsSummary ? (
              <div className="space-y-1 text-sm">
                <p>{summary.vitalsSummary.measurementCount} measurements</p>
                {summary.vitalsSummary.temperature && (
                  <p className="text-muted-foreground">
                    Temp: {summary.vitalsSummary.temperature.avg.toFixed(1)}&deg;C
                  </p>
                )}
                {summary.vitalsSummary.pulseRate && (
                  <p className="text-muted-foreground">
                    Pulse: {summary.vitalsSummary.pulseRate.avg.toFixed(0)} bpm
                  </p>
                )}
                {summary.vitalsSummary.alertCount > 0 && (
                  <p className="text-red-600 font-medium">
                    {summary.vitalsSummary.alertCount} alert(s)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* I/O Balance Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-medium">I/O Balance</span>
            </div>
            {summary.ioBalance ? (
              <div className="space-y-1 text-sm">
                <p className="text-lg font-bold">
                  {summary.ioBalance.balance > 0 ? '+' : ''}
                  {summary.ioBalance.balance} mL
                </p>
                <p className="text-muted-foreground">In: {summary.ioBalance.intake.total} mL</p>
                <p className="text-muted-foreground">Out: {summary.ioBalance.output.total} mL</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Medications Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Medications</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-lg font-bold">
                {summary.medicationCompliance.complianceRate.toFixed(0)}%
              </p>
              <p className="text-muted-foreground">
                {summary.medicationCompliance.administered}/{summary.medicationCompliance.scheduled}{' '}
                administered
              </p>
              {summary.medicationCompliance.held > 0 && (
                <p className="text-yellow-600">{summary.medicationCompliance.held} held</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Alerts</span>
            </div>
            {summary.alerts.length > 0 ? (
              <div className="space-y-1">
                {summary.alerts.slice(0, 3).map((alert, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge
                      variant={
                        severityColor(alert.severity) as 'destructive' | 'secondary' | 'outline'
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <span className="text-xs truncate">{alert.message}</span>
                  </div>
                ))}
                {summary.alerts.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{summary.alerts.length - 3} more</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-green-600 font-medium">No alerts</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportDetailView({ report }: { report: DailyReport }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Report: {report.reportDate}</CardTitle>
            {report.patientStatus && (
              <Badge
                variant={
                  report.patientStatus === 'CRITICAL'
                    ? 'destructive'
                    : report.patientStatus === 'DECLINING'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {report.patientStatus}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Generated at {new Date(report.generatedAt).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          {report.summary && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-accent/50">
              <p className="text-sm text-muted-foreground">I/O Balance</p>
              <p className="text-2xl font-bold">
                {report.ioBalance != null
                  ? `${report.ioBalance > 0 ? '+' : ''}${report.ioBalance} mL`
                  : 'N/A'}
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                <span>Intake: {report.totalIntake ?? 0} mL</span>
                {' / '}
                <span>Output: {report.totalOutput ?? 0} mL</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-accent/50">
              <p className="text-sm text-muted-foreground">Medications Given</p>
              <p className="text-2xl font-bold">{report.medicationsGiven ?? 0}</p>
              {report.medicationsHeld != null && report.medicationsHeld > 0 && (
                <p className="text-xs text-yellow-600 mt-1">{report.medicationsHeld} held</p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-accent/50">
              <p className="text-sm text-muted-foreground">Vital Measurements</p>
              <p className="text-2xl font-bold">{report.vitalsSummary?.measurementCount ?? 0}</p>
              {report.vitalsSummary && report.vitalsSummary.alertCount > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {report.vitalsSummary.alertCount} alert(s)
                </p>
              )}
            </div>
          </div>

          {/* Vitals Detail */}
          {report.vitalsSummary && (
            <div className="mb-6">
              <h4 className="font-medium mb-3">Vitals Summary</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Measurement</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Avg</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.vitalsSummary.temperature && (
                    <TableRow>
                      <TableCell className="font-medium">Temperature (&deg;C)</TableCell>
                      <TableCell>{report.vitalsSummary.temperature.min.toFixed(1)}</TableCell>
                      <TableCell>{report.vitalsSummary.temperature.avg.toFixed(1)}</TableCell>
                      <TableCell>{report.vitalsSummary.temperature.max.toFixed(1)}</TableCell>
                      <TableCell>{report.vitalsSummary.temperature.count}</TableCell>
                    </TableRow>
                  )}
                  {report.vitalsSummary.bloodPressure.systolic && (
                    <TableRow>
                      <TableCell className="font-medium">Systolic BP (mmHg)</TableCell>
                      <TableCell>{report.vitalsSummary.bloodPressure.systolic.min}</TableCell>
                      <TableCell>
                        {report.vitalsSummary.bloodPressure.systolic.avg.toFixed(0)}
                      </TableCell>
                      <TableCell>{report.vitalsSummary.bloodPressure.systolic.max}</TableCell>
                      <TableCell>{report.vitalsSummary.bloodPressure.systolic.count}</TableCell>
                    </TableRow>
                  )}
                  {report.vitalsSummary.bloodPressure.diastolic && (
                    <TableRow>
                      <TableCell className="font-medium">Diastolic BP (mmHg)</TableCell>
                      <TableCell>{report.vitalsSummary.bloodPressure.diastolic.min}</TableCell>
                      <TableCell>
                        {report.vitalsSummary.bloodPressure.diastolic.avg.toFixed(0)}
                      </TableCell>
                      <TableCell>{report.vitalsSummary.bloodPressure.diastolic.max}</TableCell>
                      <TableCell>{report.vitalsSummary.bloodPressure.diastolic.count}</TableCell>
                    </TableRow>
                  )}
                  {report.vitalsSummary.pulseRate && (
                    <TableRow>
                      <TableCell className="font-medium">Pulse Rate (bpm)</TableCell>
                      <TableCell>{report.vitalsSummary.pulseRate.min}</TableCell>
                      <TableCell>{report.vitalsSummary.pulseRate.avg.toFixed(0)}</TableCell>
                      <TableCell>{report.vitalsSummary.pulseRate.max}</TableCell>
                      <TableCell>{report.vitalsSummary.pulseRate.count}</TableCell>
                    </TableRow>
                  )}
                  {report.vitalsSummary.respiratoryRate && (
                    <TableRow>
                      <TableCell className="font-medium">Respiratory Rate</TableCell>
                      <TableCell>{report.vitalsSummary.respiratoryRate.min}</TableCell>
                      <TableCell>{report.vitalsSummary.respiratoryRate.avg.toFixed(0)}</TableCell>
                      <TableCell>{report.vitalsSummary.respiratoryRate.max}</TableCell>
                      <TableCell>{report.vitalsSummary.respiratoryRate.count}</TableCell>
                    </TableRow>
                  )}
                  {report.vitalsSummary.oxygenSaturation && (
                    <TableRow>
                      <TableCell className="font-medium">SpO2 (%)</TableCell>
                      <TableCell>{report.vitalsSummary.oxygenSaturation.min}</TableCell>
                      <TableCell>{report.vitalsSummary.oxygenSaturation.avg.toFixed(1)}</TableCell>
                      <TableCell>{report.vitalsSummary.oxygenSaturation.max}</TableCell>
                      <TableCell>{report.vitalsSummary.oxygenSaturation.count}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Alerts */}
          {report.alerts && report.alerts.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Alerts</h4>
              <div className="space-y-2">
                {report.alerts.map((alert, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Badge
                      variant={
                        severityColor(alert.severity) as 'destructive' | 'secondary' | 'outline'
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{alert.type}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(alert.recordedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
