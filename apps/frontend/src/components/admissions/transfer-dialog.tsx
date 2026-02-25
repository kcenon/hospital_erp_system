'use client';

import { useState } from 'react';
import { useTransferPatient, useAvailableBeds, useFloors } from '@/hooks';
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

interface TransferDialogProps {
  admissionId: string;
  currentBedId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransferDialog({
  admissionId,
  open,
  onOpenChange,
  onSuccess,
}: TransferDialogProps) {
  const transferPatient = useTransferPatient();
  const { data: floors } = useFloors();

  const [floorId, setFloorId] = useState('');
  const { data: availableBeds } = useAvailableBeds(floorId ? { floorId } : {});

  const [form, setForm] = useState({
    toBedId: '',
    transferDate: new Date().toISOString().slice(0, 10),
    transferTime: new Date().toTimeString().slice(0, 5),
    reason: '',
    notes: '',
  });

  const floorOptions = [
    { value: '', label: 'Select Floor' },
    ...(floors?.map((f) => ({
      value: f.id,
      label: `${f.building ? f.building + ' - ' : ''}${f.name}`,
    })) || []),
  ];

  const bedOptions = [
    { value: '', label: 'Select Destination Bed' },
    ...(availableBeds?.map((b) => ({
      value: b.id,
      label: `${b.room.roomNumber} - ${b.bedNumber} (${b.room.roomType})`,
    })) || []),
  ];

  const handleSubmit = async () => {
    try {
      await transferPatient.mutateAsync({
        admissionId,
        data: {
          toBedId: form.toBedId,
          transferDate: form.transferDate,
          transferTime: form.transferTime,
          reason: form.reason,
          notes: form.notes || undefined,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Patient</DialogTitle>
          <DialogDescription>
            Select a new bed and provide a reason for the transfer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Floor</Label>
            <LegacySelect
              options={floorOptions}
              value={floorId}
              onChange={(e) => {
                setFloorId(e.target.value);
                setForm({ ...form, toBedId: '' });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Destination Bed *</Label>
            <LegacySelect
              options={bedOptions}
              value={form.toBedId}
              onChange={(e) => setForm({ ...form, toBedId: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transfer Date *</Label>
              <Input
                type="date"
                value={form.transferDate}
                onChange={(e) => setForm({ ...form, transferDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Transfer Time *</Label>
              <Input
                type="time"
                value={form.transferTime}
                onChange={(e) => setForm({ ...form, transferTime: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason for transfer"
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.toBedId || !form.reason || transferPatient.isPending}
          >
            {transferPatient.isPending ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
