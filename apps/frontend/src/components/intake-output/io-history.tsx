'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useIOHistory } from '@/hooks/use-intake-output';

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface IOHistoryProps {
  admissionId: string;
}

export function IOHistory({ admissionId }: IOHistoryProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useIOHistory(admissionId, { page, limit: 10 });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const records = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No I/O records found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead className="text-right text-blue-600">Intake (mL)</TableHead>
              <TableHead className="text-right text-orange-600">Output (mL)</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="text-sm">{formatDateTime(record.recordTime)}</TableCell>
                <TableCell className="text-right font-mono text-blue-600">
                  {record.totalIntake}
                </TableCell>
                <TableCell className="text-right font-mono text-orange-600">
                  {record.totalOutput}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={record.balance >= 0 ? 'outline' : 'destructive'}
                    className="font-mono"
                  >
                    {record.balance >= 0 ? '+' : ''}
                    {record.balance}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {record.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
