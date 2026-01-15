'use client';

import Link from 'next/link';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { Calendar, Clock, Users, Play, Pause, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Round, RoundStatus, RoundType } from '@/types';

interface RoundingSessionCardProps {
  round: Round;
  onStart?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onComplete?: (id: string) => void;
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeString: string | null): string {
  if (!timeString) return '-';
  return timeString.slice(0, 5);
}

export function RoundingSessionCard({
  round,
  onStart,
  onPause,
  onResume,
  onComplete,
}: RoundingSessionCardProps) {
  const status = statusConfig[round.status];
  const visitedCount = round.records?.filter((r) => r.visitedAt !== null).length ?? 0;
  const totalCount = round.records?.length ?? 0;
  const progress = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        round.status === 'IN_PROGRESS' && 'border-yellow-300 bg-yellow-50/50',
      )}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Link href={`/rounding/${round.id}`} className="hover:underline">
              <h3 className="font-semibold text-lg">{round.roundNumber}</h3>
            </Link>
            <p className="text-sm text-muted-foreground">
              {roundTypeLabels[round.roundType]} Round
            </p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(round.scheduledDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatTime(round.scheduledTime)}</span>
          </div>
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {visitedCount} / {totalCount} patients
              </span>
            </div>
          )}
        </div>

        {round.status === 'IN_PROGRESS' && totalCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {round.status === 'PLANNED' && onStart && (
            <Button size="sm" className="flex-1" onClick={() => onStart(round.id)}>
              <Play className="h-4 w-4" />
              Start
            </Button>
          )}
          {round.status === 'IN_PROGRESS' && (
            <>
              {onPause && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onPause(round.id)}
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              {onComplete && (
                <Button size="sm" className="flex-1" onClick={() => onComplete(round.id)}>
                  <CheckCircle className="h-4 w-4" />
                  Complete
                </Button>
              )}
            </>
          )}
          {round.status === 'PAUSED' && onResume && (
            <Button size="sm" className="flex-1" onClick={() => onResume(round.id)}>
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          <Link href={`/rounding/${round.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
