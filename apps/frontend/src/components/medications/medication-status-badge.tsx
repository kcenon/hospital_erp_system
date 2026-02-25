'use client';

import { Badge } from '@/components/ui/badge';
import type { MedicationStatus } from '@/types';

const statusConfig: Record<
  MedicationStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  SCHEDULED: { label: 'Scheduled', variant: 'outline' },
  ADMINISTERED: { label: 'Administered', variant: 'default' },
  HELD: { label: 'Held', variant: 'secondary' },
  REFUSED: { label: 'Refused', variant: 'destructive' },
  MISSED: { label: 'Missed', variant: 'destructive' },
};

interface MedicationStatusBadgeProps {
  status: MedicationStatus;
}

export function MedicationStatusBadge({ status }: MedicationStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
