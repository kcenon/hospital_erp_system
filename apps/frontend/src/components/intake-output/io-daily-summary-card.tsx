'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIODailySummary } from '@/hooks/use-intake-output';

interface IODailySummaryCardProps {
  admissionId: string;
  date: string;
}

export function IODailySummaryCard({ admissionId, date }: IODailySummaryCardProps) {
  const { data: summary, isLoading } = useIODailySummary(admissionId, date);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No I/O data for today.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Today&apos;s I/O Balance
          <Badge
            variant={
              summary.status === 'NORMAL'
                ? 'outline'
                : summary.status === 'NEGATIVE'
                  ? 'destructive'
                  : 'default'
            }
          >
            {summary.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Intake</p>
            <p className="text-lg font-semibold text-blue-600">{summary.intake.total} mL</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Output</p>
            <p className="text-lg font-semibold text-orange-600">{summary.output.total} mL</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Balance</p>
            <p
              className={`text-lg font-semibold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {summary.balance >= 0 ? '+' : ''}
              {summary.balance} mL
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
