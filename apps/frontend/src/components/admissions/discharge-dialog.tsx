'use client';

import { useState } from 'react';
import { useDischargePatient } from '@/hooks';
import {
  Button,
  Input,
  Label,
  LegacySelect,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';
import type { DischargeType } from '@/types';

const dischargeTypeOptions = [
  { value: 'NORMAL', label: 'Normal Discharge' },
  { value: 'TRANSFER', label: 'Transfer to Another Facility' },
  { value: 'AMA', label: 'Against Medical Advice' },
  { value: 'DECEASED', label: 'Deceased' },
];

interface DischargeDialogProps {
  admissionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DischargeDialog({
  admissionId,
  open,
  onOpenChange,
  onSuccess,
}: DischargeDialogProps) {
  const dischargePatient = useDischargePatient();

  const [form, setForm] = useState({
    dischargeType: 'NORMAL' as DischargeType,
    dischargeDate: new Date().toISOString().slice(0, 10),
    dischargeTime: new Date().toTimeString().slice(0, 5),
    dischargeDiagnosis: '',
    dischargeSummary: '',
    followUpInstructions: '',
    followUpDate: '',
  });

  const handleSubmit = async () => {
    try {
      await dischargePatient.mutateAsync({
        admissionId,
        data: {
          dischargeDate: form.dischargeDate,
          dischargeTime: form.dischargeTime,
          dischargeType: form.dischargeType,
          dischargeDiagnosis: form.dischargeDiagnosis || undefined,
          dischargeSummary: form.dischargeSummary || undefined,
          followUpInstructions: form.followUpInstructions || undefined,
          followUpDate: form.followUpDate || undefined,
        },
      });
      onSuccess();
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Discharge Patient</DialogTitle>
          <DialogDescription>
            Complete the discharge form. The bed will be automatically released.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Discharge Type *</Label>
            <LegacySelect
              options={dischargeTypeOptions}
              value={form.dischargeType}
              onChange={(e) => setForm({ ...form, dischargeType: e.target.value as DischargeType })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discharge Date *</Label>
              <Input
                type="date"
                value={form.dischargeDate}
                onChange={(e) => setForm({ ...form, dischargeDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Discharge Time *</Label>
              <Input
                type="time"
                value={form.dischargeTime}
                onChange={(e) => setForm({ ...form, dischargeTime: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Discharge Diagnosis</Label>
            <Input
              value={form.dischargeDiagnosis}
              onChange={(e) => setForm({ ...form, dischargeDiagnosis: e.target.value })}
              placeholder="Final diagnosis at discharge"
            />
          </div>
          <div className="space-y-2">
            <Label>Discharge Summary</Label>
            <Textarea
              value={form.dischargeSummary}
              onChange={(e) => setForm({ ...form, dischargeSummary: e.target.value })}
              placeholder="Summary of hospitalization and treatment..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Follow-up Instructions</Label>
            <Textarea
              value={form.followUpInstructions}
              onChange={(e) => setForm({ ...form, followUpInstructions: e.target.value })}
              placeholder="Post-discharge care instructions..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={dischargePatient.isPending}
          >
            {dischargePatient.isPending ? 'Discharging...' : 'Confirm Discharge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
