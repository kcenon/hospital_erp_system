'use client';

import { useLatestVitalSign } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from '@/components/ui';
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { VitalAlert, AlertSeverity } from '@/types';
import { cn } from '@/lib/utils';

interface VitalAlertsProps {
  admissionId: string;
  alerts?: VitalAlert[];
  className?: string;
}

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return <XCircle className="h-4 w-4" />;
    case 'HIGH':
      return <AlertCircle className="h-4 w-4" />;
    case 'MEDIUM':
      return <AlertTriangle className="h-4 w-4" />;
    case 'LOW':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500 text-white hover:bg-red-600';
    case 'HIGH':
      return 'bg-orange-500 text-white hover:bg-orange-600';
    case 'MEDIUM':
      return 'bg-yellow-500 text-white hover:bg-yellow-600';
    case 'LOW':
      return 'bg-blue-500 text-white hover:bg-blue-600';
    default:
      return 'bg-gray-500 text-white hover:bg-gray-600';
  }
}

function getSeverityBorderColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'border-l-red-500';
    case 'HIGH':
      return 'border-l-orange-500';
    case 'MEDIUM':
      return 'border-l-yellow-500';
    case 'LOW':
      return 'border-l-blue-500';
    default:
      return 'border-l-gray-500';
  }
}

function AlertItem({ alert }: { alert: VitalAlert }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-md border border-l-4 bg-card',
        getSeverityBorderColor(alert.severity),
      )}
    >
      <div className={cn('p-1 rounded', getSeverityColor(alert.severity))}>
        {getSeverityIcon(alert.severity)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{formatAlertType(alert.type)}</span>
          <Badge className={cn('text-xs', getSeverityColor(alert.severity))}>
            {alert.severity}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
      </div>
    </div>
  );
}

function formatAlertType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function VitalAlerts({ admissionId, alerts: providedAlerts, className }: VitalAlertsProps) {
  const { data: latestVital, isLoading } = useLatestVitalSign(admissionId);

  const alerts = providedAlerts ?? latestVital?.alerts ?? [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" />
            Vital Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {alerts.length > 0 ? (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Vital Alerts ({alerts.length})</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>No Active Alerts</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            All vital signs are within normal range.
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <AlertItem key={idx} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for inline display
export function VitalAlertsInline({ alerts }: { alerts: VitalAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {alerts.map((alert, idx) => (
        <Badge key={idx} className={cn('text-xs gap-1', getSeverityColor(alert.severity))}>
          {getSeverityIcon(alert.severity)}
          {formatAlertType(alert.type)}
        </Badge>
      ))}
    </div>
  );
}
