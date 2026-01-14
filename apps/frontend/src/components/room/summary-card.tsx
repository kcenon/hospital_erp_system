'use client';

import { Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';

type SummaryVariant = 'default' | 'occupied' | 'empty' | 'reserved' | 'maintenance';

interface SummaryCardProps {
  title: string;
  value: number;
  variant?: SummaryVariant;
  className?: string;
}

const variantStyles: Record<SummaryVariant, string> = {
  default: 'border-border',
  occupied: 'border-blue-300 bg-blue-50 dark:bg-blue-950',
  empty: 'border-green-300 bg-green-50 dark:bg-green-950',
  reserved: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950',
  maintenance: 'border-gray-300 bg-gray-50 dark:bg-gray-950',
};

const variantTextColors: Record<SummaryVariant, string> = {
  default: 'text-foreground',
  occupied: 'text-blue-700 dark:text-blue-300',
  empty: 'text-green-700 dark:text-green-300',
  reserved: 'text-yellow-700 dark:text-yellow-300',
  maintenance: 'text-gray-700 dark:text-gray-300',
};

export function SummaryCard({ title, value, variant = 'default', className }: SummaryCardProps) {
  return (
    <Card className={cn('border-2', variantStyles[variant], className)}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn('text-3xl font-bold', variantTextColors[variant])}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
