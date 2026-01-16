'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  useRound,
  useRoundingPatients,
  useFloors,
  useStartRound,
  usePauseRound,
  useResumeRound,
  useCompleteRound,
  useCancelRound,
  useAddRoundRecord,
  useUpdateRoundRecord,
} from '@/hooks';
import { Card, CardContent, Button, Skeleton } from '@/components/ui';
import { RoundingHeader, RoundingPatientCard, RoundRecordForm } from '@/components/rounding';
import { Users, Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { UpdateRoundRecordData, RoundingPatient } from '@/types';

interface RoundingDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeString: string | null): string {
  if (!timeString) return 'Not scheduled';
  return timeString.slice(0, 5);
}

export default function RoundingDetailPage({ params }: RoundingDetailPageProps) {
  const { id } = use(params);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState<number | null>(null);

  const { data: round, isLoading: roundLoading, error: roundError } = useRound(id);
  const { data: patientList, isLoading: patientsLoading } = useRoundingPatients(id);
  const { data: floors } = useFloors();

  const startRound = useStartRound();
  const pauseRound = usePauseRound();
  const resumeRound = useResumeRound();
  const completeRound = useCompleteRound();
  const cancelRound = useCancelRound();
  const addRecord = useAddRoundRecord(id);
  const updateRecord = useUpdateRoundRecord(id);

  const isMutating =
    startRound.isPending ||
    pauseRound.isPending ||
    resumeRound.isPending ||
    completeRound.isPending ||
    cancelRound.isPending;

  const floorName = floors?.find((f) => f.id === round?.floorId)?.name;

  const selectedPatient: RoundingPatient | null =
    selectedPatientIndex !== null && patientList
      ? patientList.patients[selectedPatientIndex] || null
      : null;

  const handlePatientSelect = useCallback((index: number) => {
    setSelectedPatientIndex(index);
  }, []);

  const handleSaveRecord = useCallback(
    async (data: UpdateRoundRecordData) => {
      if (!selectedPatient) return;

      try {
        if (selectedPatient.existingRecordId) {
          await updateRecord.mutateAsync({
            recordId: selectedPatient.existingRecordId,
            data,
          });
        } else {
          await addRecord.mutateAsync({
            admissionId: selectedPatient.admissionId,
            ...data,
          });
        }

        if (patientList && selectedPatientIndex !== null) {
          const nextIndex = selectedPatientIndex + 1;
          if (nextIndex < patientList.patients.length) {
            setSelectedPatientIndex(nextIndex);
          } else {
            setSelectedPatientIndex(null);
          }
        }
      } catch (err) {
        console.error('Failed to save record:', err);
      }
    },
    [selectedPatient, selectedPatientIndex, patientList, addRecord, updateRecord],
  );

  const handleSkip = useCallback(() => {
    if (patientList && selectedPatientIndex !== null) {
      const nextIndex = selectedPatientIndex + 1;
      if (nextIndex < patientList.patients.length) {
        setSelectedPatientIndex(nextIndex);
      } else {
        setSelectedPatientIndex(null);
      }
    }
  }, [selectedPatientIndex, patientList]);

  const handlePreviousPatient = useCallback(() => {
    if (selectedPatientIndex !== null && selectedPatientIndex > 0) {
      setSelectedPatientIndex(selectedPatientIndex - 1);
    }
  }, [selectedPatientIndex]);

  const handleNextPatient = useCallback(() => {
    if (patientList && selectedPatientIndex !== null) {
      const nextIndex = selectedPatientIndex + 1;
      if (nextIndex < patientList.patients.length) {
        setSelectedPatientIndex(nextIndex);
      }
    }
  }, [selectedPatientIndex, patientList]);

  if (roundLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="container mx-auto px-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (roundError || !round) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to load round</h2>
            <p className="text-muted-foreground mb-4">
              The rounding session could not be found or an error occurred.
            </p>
            <Link href="/rounding">
              <Button>Back to Sessions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = patientList
    ? Math.round((patientList.visitedCount / patientList.totalPatients) * 100) || 0
    : 0;

  const isInProgress = round.status === 'IN_PROGRESS';

  return (
    <div className="min-h-screen bg-gray-50">
      <RoundingHeader
        round={round}
        floorName={floorName}
        onStart={() => startRound.mutate(id)}
        onPause={() => pauseRound.mutate(id)}
        onResume={() => resumeRound.mutate(id)}
        onComplete={() => completeRound.mutate(id)}
        onCancel={() => cancelRound.mutate(id)}
        isLoading={isMutating}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-semibold">{formatDate(round.scheduledDate)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Time</p>
                <p className="font-semibold">{formatTime(round.scheduledTime)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patients</p>
                <p className="font-semibold">
                  {patientList ? `${patientList.visitedCount} / ${patientList.totalPatients}` : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isInProgress && patientList && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Round Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isInProgress && selectedPatient ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Patient List</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPatient}
                    disabled={selectedPatientIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {(selectedPatientIndex ?? 0) + 1} / {patientList?.patients.length ?? 0}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPatient}
                    disabled={
                      !patientList || selectedPatientIndex === patientList.patients.length - 1
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {patientList?.patients.map((patient, index) => (
                  <RoundingPatientCard
                    key={patient.admissionId}
                    patient={patient}
                    index={index}
                    isSelected={selectedPatientIndex === index}
                    onClick={() => handlePatientSelect(index)}
                  />
                ))}
              </div>
            </div>
            <div className="lg:sticky lg:top-24 h-fit">
              <RoundRecordForm
                patient={selectedPatient}
                onSave={handleSaveRecord}
                onSkip={handleSkip}
                isSaving={addRecord.isPending || updateRecord.isPending}
              />
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Patient List</h2>
                <p className="text-sm text-muted-foreground">
                  {isInProgress
                    ? 'Select a patient to start recording'
                    : 'Patients to visit during this round'}
                </p>
              </div>
              {patientsLoading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !patientList || patientList.patients.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No patients assigned to this round.
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {patientList.patients.map((patient, index) => (
                    <RoundingPatientCard
                      key={patient.admissionId}
                      patient={patient}
                      index={index}
                      isSelected={false}
                      onClick={isInProgress ? () => handlePatientSelect(index) : undefined}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {round.notes && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{round.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
