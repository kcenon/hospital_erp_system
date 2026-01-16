'use client';

import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { RoundingPatient } from '@/types';

interface RoundingPatientCardProps {
  patient: RoundingPatient;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function RoundingPatientCard({
  patient,
  index,
  isSelected = false,
  onClick,
}: RoundingPatientCardProps) {
  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all touch-manipulation',
        isSelected && 'ring-2 ring-primary',
        patient.isVisited && 'bg-green-50 border-green-200',
        !patient.isVisited && 'hover:bg-gray-50',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium shrink-0',
              patient.isVisited ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700',
            )}
          >
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{patient.patient.name}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {patient.bed.roomNumber}-{patient.bed.bedNumber}
              </Badge>
              {patient.isVisited && (
                <Badge variant="success" className="text-xs shrink-0">
                  Visited
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {patient.admission.diagnosis || 'No diagnosis'} | Day{' '}
              {patient.admission.admissionDays}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {patient.latestVitals?.hasAlert && (
            <Badge variant="destructive" className="text-xs">
              Alert
            </Badge>
          )}
        </div>
      </div>

      {patient.latestVitals && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {patient.latestVitals.temperature && <span>T: {patient.latestVitals.temperature}°C</span>}
          {patient.latestVitals.bloodPressure && (
            <span>BP: {patient.latestVitals.bloodPressure}</span>
          )}
          {patient.latestVitals.oxygenSaturation && (
            <span>SpO2: {patient.latestVitals.oxygenSaturation}%</span>
          )}
          {patient.latestVitals.pulseRate && <span>PR: {patient.latestVitals.pulseRate}</span>}
        </div>
      )}

      {patient.previousRoundNote && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <span className="font-medium text-muted-foreground">Previous: </span>
          <span className="text-gray-700">{patient.previousRoundNote}</span>
        </div>
      )}
    </Card>
  );
}
