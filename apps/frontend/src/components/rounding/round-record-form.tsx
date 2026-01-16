'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  Button,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@/components/ui';
import type { RoundingPatient, RoundPatientStatus, UpdateRoundRecordData } from '@/types';

interface RoundRecordFormData {
  patientStatus: RoundPatientStatus | '';
  chiefComplaint: string;
  observation: string;
  assessment: string;
  plan: string;
  orders: string;
}

interface RoundRecordFormProps {
  patient: RoundingPatient;
  onSave: (data: UpdateRoundRecordData) => void;
  onSkip: () => void;
  isSaving?: boolean;
}

const patientStatusOptions: { value: RoundPatientStatus; label: string; color: string }[] = [
  { value: 'STABLE', label: 'Stable', color: 'bg-blue-100 text-blue-700' },
  { value: 'IMPROVING', label: 'Improving', color: 'bg-green-100 text-green-700' },
  { value: 'DECLINING', label: 'Declining', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

export function RoundRecordForm({
  patient,
  onSave,
  onSkip,
  isSaving = false,
}: RoundRecordFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<RoundRecordFormData>({
    defaultValues: {
      patientStatus: '',
      chiefComplaint: '',
      observation: '',
      assessment: '',
      plan: '',
      orders: '',
    },
  });

  const formData = watch();

  const saveData = useCallback(() => {
    const data: UpdateRoundRecordData = {};
    if (formData.patientStatus) data.patientStatus = formData.patientStatus as RoundPatientStatus;
    if (formData.chiefComplaint) data.chiefComplaint = formData.chiefComplaint;
    if (formData.observation) data.observation = formData.observation;
    if (formData.assessment) data.assessment = formData.assessment;
    if (formData.plan) data.plan = formData.plan;
    if (formData.orders) data.orders = formData.orders;

    if (Object.keys(data).length > 0) {
      onSave(data);
    }
  }, [formData, onSave]);

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      const hasData =
        formData.patientStatus ||
        formData.chiefComplaint ||
        formData.observation ||
        formData.assessment ||
        formData.plan ||
        formData.orders;
      if (hasData) {
        saveData();
      }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, saveData]);

  useEffect(() => {
    reset({
      patientStatus: '',
      chiefComplaint: '',
      observation: '',
      assessment: '',
      plan: '',
      orders: '',
    });
  }, [patient.admissionId, reset]);

  const onSubmit = (data: RoundRecordFormData) => {
    const submitData: UpdateRoundRecordData = {};
    if (data.patientStatus) submitData.patientStatus = data.patientStatus as RoundPatientStatus;
    if (data.chiefComplaint) submitData.chiefComplaint = data.chiefComplaint;
    if (data.observation) submitData.observation = data.observation;
    if (data.assessment) submitData.assessment = data.assessment;
    if (data.plan) submitData.plan = data.plan;
    if (data.orders) submitData.orders = data.orders;

    onSave(submitData);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{patient.patient.name}</h3>
              <p className="text-sm text-muted-foreground">
                {patient.bed.roomNumber}-{patient.bed.bedNumber} | Day{' '}
                {patient.admission.admissionDays}
              </p>
            </div>
            {patient.latestVitals?.hasAlert && <Badge variant="destructive">Vital Alert</Badge>}
          </div>
          {patient.admission.diagnosis && (
            <p className="mt-2 text-sm">{patient.admission.diagnosis}</p>
          )}
          {patient.previousRoundNote && (
            <div className="mt-2 pt-2 border-t">
              <span className="text-xs font-medium text-muted-foreground">Previous Round: </span>
              <span className="text-sm">{patient.previousRoundNote}</span>
            </div>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Patient Status</Label>
            <Select
              value={formData.patientStatus}
              onValueChange={(value) => setValue('patientStatus', value as RoundPatientStatus)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select patient status" />
              </SelectTrigger>
              <SelectContent>
                {patientStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.color}`}>
                        {option.label}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chiefComplaint">Chief Complaint</Label>
            <Textarea
              id="chiefComplaint"
              {...register('chiefComplaint')}
              placeholder="Main presenting complaint..."
              className="min-h-[60px] text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observation</Label>
            <Textarea
              id="observation"
              {...register('observation')}
              placeholder="Clinical observations..."
              className="min-h-[80px] text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessment">Assessment</Label>
            <Textarea
              id="assessment"
              {...register('assessment')}
              placeholder="Clinical assessment..."
              className="min-h-[60px] text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Textarea
              id="plan"
              {...register('plan')}
              placeholder="Treatment plan..."
              className="min-h-[60px] text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orders">Orders</Label>
            <Textarea
              id="orders"
              {...register('orders')}
              placeholder="Clinical orders..."
              className="min-h-[60px] text-base"
            />
          </div>
        </form>
      </CardContent>

      <div className="p-4 border-t flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 text-base"
          onClick={onSkip}
          disabled={isSaving}
        >
          Skip
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 text-base"
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save & Next'}
        </Button>
      </div>
    </Card>
  );
}
