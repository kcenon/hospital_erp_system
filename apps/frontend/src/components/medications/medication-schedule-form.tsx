'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LegacySelect } from '@/components/ui/select';
import { useScheduleMedication } from '@/hooks/use-medications';
import type { MedicationRoute } from '@/types';

const ROUTE_OPTIONS: { value: MedicationRoute; label: string }[] = [
  { value: 'PO', label: 'PO (Oral)' },
  { value: 'IV', label: 'IV (Intravenous)' },
  { value: 'IM', label: 'IM (Intramuscular)' },
  { value: 'SC', label: 'SC (Subcutaneous)' },
  { value: 'SL', label: 'SL (Sublingual)' },
  { value: 'TOP', label: 'TOP (Topical)' },
  { value: 'INH', label: 'INH (Inhalation)' },
  { value: 'PR', label: 'PR (Per Rectum)' },
  { value: 'OTHER', label: 'Other' },
];

interface MedicationScheduleFormProps {
  admissionId: string;
  onSuccess?: () => void;
}

export function MedicationScheduleForm({ admissionId, onSuccess }: MedicationScheduleFormProps) {
  const scheduleMutation = useScheduleMedication(admissionId);
  const [showSuccess, setShowSuccess] = useState(false);

  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState<MedicationRoute>('PO');
  const [frequency, setFrequency] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!medicationName.trim() || !dosage.trim()) return;

    try {
      await scheduleMutation.mutateAsync({
        medicationName: medicationName.trim(),
        dosage: dosage.trim(),
        route,
        frequency: frequency.trim() || undefined,
        scheduledTime: scheduledTime || undefined,
        notes: notes.trim() || undefined,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setMedicationName('');
        setDosage('');
        setRoute('PO');
        setFrequency('');
        setScheduledTime('');
        setNotes('');
        onSuccess?.();
      }, 1500);
    } catch {
      // Error handled by React Query
    }
  };

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Medication scheduled successfully</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="medicationName">Medication Name *</Label>
          <Input
            id="medicationName"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder="e.g., Amoxicillin 500mg"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage *</Label>
          <Input
            id="dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g., 500mg"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="route">Route *</Label>
          <LegacySelect
            id="route"
            value={route}
            onChange={(e) => setRoute(e.target.value as MedicationRoute)}
            options={ROUTE_OPTIONS}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Input
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="e.g., TID, BID, QD"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="scheduledTime">Scheduled Time</Label>
          <Input
            id="scheduledTime"
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions..."
            rows={2}
          />
        </div>
      </div>

      {scheduleMutation.error && (
        <p className="text-sm text-destructive">
          {scheduleMutation.error instanceof Error
            ? scheduleMutation.error.message
            : 'Failed to schedule medication'}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={scheduleMutation.isPending || !medicationName.trim() || !dosage.trim()}
        >
          {scheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Schedule Medication
        </Button>
      </div>
    </form>
  );
}
