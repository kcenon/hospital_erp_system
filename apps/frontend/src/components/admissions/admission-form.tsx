'use client';

import { useState } from 'react';
import { useCreateAdmission, useAvailableBeds, useFloors } from '@/hooks';
import {
  Button,
  Input,
  Label,
  LegacySelect,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import type { AdmissionType } from '@/types';

const admissionTypeOptions = [
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'ELECTIVE', label: 'Elective' },
  { value: 'TRANSFER', label: 'Transfer' },
];

interface AdmissionFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdmissionForm({ patientId, onSuccess, onCancel }: AdmissionFormProps) {
  const createAdmission = useCreateAdmission();
  const { data: floors } = useFloors();

  const [floorId, setFloorId] = useState('');
  const { data: availableBeds } = useAvailableBeds(floorId ? { floorId } : {});

  const [form, setForm] = useState({
    admissionType: 'ELECTIVE' as AdmissionType,
    bedId: '',
    admissionDate: new Date().toISOString().slice(0, 10),
    admissionTime: new Date().toTimeString().slice(0, 5),
    attendingDoctorId: '',
    primaryNurseId: '',
    diagnosis: '',
    chiefComplaint: '',
    expectedDischargeDate: '',
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
    { value: '', label: 'Select Bed' },
    ...(availableBeds?.map((b) => ({
      value: b.id,
      label: `${b.room.roomNumber} - ${b.bedNumber} (${b.room.roomType})`,
    })) || []),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdmission.mutateAsync({
        patientId,
        bedId: form.bedId,
        admissionDate: form.admissionDate,
        admissionTime: form.admissionTime,
        admissionType: form.admissionType,
        attendingDoctorId: form.attendingDoctorId,
        primaryNurseId: form.primaryNurseId || undefined,
        diagnosis: form.diagnosis || undefined,
        chiefComplaint: form.chiefComplaint || undefined,
        expectedDischargeDate: form.expectedDischargeDate || undefined,
        notes: form.notes || undefined,
      });
      onSuccess();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Admission</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Admission Type *</Label>
              <LegacySelect
                options={admissionTypeOptions}
                value={form.admissionType}
                onChange={(e) =>
                  setForm({ ...form, admissionType: e.target.value as AdmissionType })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <LegacySelect
                options={floorOptions}
                value={floorId}
                onChange={(e) => {
                  setFloorId(e.target.value);
                  setForm({ ...form, bedId: '' });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Bed *</Label>
              <LegacySelect
                options={bedOptions}
                value={form.bedId}
                onChange={(e) => setForm({ ...form, bedId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Admission Date *</Label>
              <Input
                type="date"
                value={form.admissionDate}
                onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Admission Time *</Label>
              <Input
                type="time"
                value={form.admissionTime}
                onChange={(e) => setForm({ ...form, admissionTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Attending Doctor ID *</Label>
              <Input
                value={form.attendingDoctorId}
                onChange={(e) => setForm({ ...form, attendingDoctorId: e.target.value })}
                placeholder="Doctor user ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Primary Nurse ID</Label>
              <Input
                value={form.primaryNurseId}
                onChange={(e) => setForm({ ...form, primaryNurseId: e.target.value })}
                placeholder="Nurse user ID (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Discharge Date</Label>
              <Input
                type="date"
                value={form.expectedDischargeDate}
                onChange={(e) => setForm({ ...form, expectedDischargeDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Diagnosis</Label>
            <Input
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              placeholder="Primary diagnosis"
            />
          </div>

          <div className="space-y-2">
            <Label>Chief Complaint</Label>
            <Input
              value={form.chiefComplaint}
              onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
              placeholder="Main symptom or complaint"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !form.bedId ||
                !form.admissionDate ||
                !form.admissionTime ||
                !form.attendingDoctorId ||
                createAdmission.isPending
              }
            >
              {createAdmission.isPending ? 'Creating...' : 'Create Admission'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
