'use client';

import { Button, Badge } from '@/components/ui';
import { Play, Pause, CheckCircle, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Round, RoundStatus, RoundType } from '@/types';

interface RoundingHeaderProps {
  round: Round;
  floorName?: string;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const statusConfig: Record<
  RoundStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  PLANNED: { label: 'Planned', variant: 'secondary' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  PAUSED: { label: 'Paused', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

const roundTypeLabels: Record<RoundType, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
  NIGHT: 'Night',
};

export function RoundingHeader({
  round,
  floorName,
  onStart,
  onPause,
  onResume,
  onComplete,
  onCancel,
  isLoading = false,
}: RoundingHeaderProps) {
  const status = statusConfig[round.status];
  const canStart = round.validTransitions?.includes('IN_PROGRESS') ?? round.status === 'PLANNED';
  const canPause = round.validTransitions?.includes('PAUSED') ?? round.status === 'IN_PROGRESS';
  const canResume = round.validTransitions?.includes('IN_PROGRESS') ?? round.status === 'PAUSED';
  const canComplete =
    round.validTransitions?.includes('COMPLETED') ?? round.status === 'IN_PROGRESS';
  const canCancel =
    round.validTransitions?.includes('CANCELLED') ?? ['PLANNED', 'PAUSED'].includes(round.status);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-white border-b sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Link href="/rounding">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{round.roundNumber}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {floorName && `${floorName} | `}
            {roundTypeLabels[round.roundType]} Round
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {canStart && onStart && (
          <Button onClick={onStart} disabled={isLoading}>
            <Play className="h-4 w-4" />
            Start Round
          </Button>
        )}
        {canPause && onPause && (
          <Button variant="outline" onClick={onPause} disabled={isLoading}>
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}
        {canResume && onResume && (
          <Button onClick={onResume} disabled={isLoading}>
            <Play className="h-4 w-4" />
            Resume
          </Button>
        )}
        {canComplete && onComplete && (
          <Button onClick={onComplete} disabled={isLoading}>
            <CheckCircle className="h-4 w-4" />
            Complete
          </Button>
        )}
        {canCancel && onCancel && (
          <Button variant="destructive" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
