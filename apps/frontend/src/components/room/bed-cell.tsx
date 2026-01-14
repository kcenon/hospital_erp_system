'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BedStatus, BedStatusType } from '@/types';

interface BedCellProps {
  bed: BedStatus;
  className?: string;
}

const statusStyles: Record<BedStatusType, string> = {
  EMPTY: 'bg-green-100 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:border-green-700',
  OCCUPIED: 'bg-blue-100 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:border-blue-700',
  RESERVED: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700',
  MAINTENANCE: 'bg-gray-100 border-gray-300 dark:bg-gray-900/30 dark:border-gray-700',
};

const statusTextColors: Record<BedStatusType, string> = {
  EMPTY: 'text-green-800 dark:text-green-200',
  OCCUPIED: 'text-blue-800 dark:text-blue-200',
  RESERVED: 'text-yellow-800 dark:text-yellow-200',
  MAINTENANCE: 'text-gray-800 dark:text-gray-200',
};

export function BedCell({ bed, className }: BedCellProps) {
  const content = (
    <div
      className={cn(
        'p-2 rounded border-2 transition-colors min-h-[60px]',
        statusStyles[bed.status],
        bed.patient && 'cursor-pointer',
        className
      )}
    >
      <div className={cn('text-sm font-medium', statusTextColors[bed.status])}>
        {bed.bedNumber}
      </div>
      {bed.patient && (
        <div className={cn('text-xs truncate mt-0.5', statusTextColors[bed.status])}>
          {bed.patient.name}
        </div>
      )}
      {bed.status === 'EMPTY' && (
        <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">Available</div>
      )}
      {bed.status === 'RESERVED' && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Reserved</div>
      )}
      {bed.status === 'MAINTENANCE' && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Maintenance</div>
      )}
    </div>
  );

  if (bed.patient) {
    return (
      <Link href={`/patients/${bed.patient.id}`}>
        {content}
      </Link>
    );
  }

  return content;
}
