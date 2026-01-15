'use client';

import { use } from 'react';
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
} from '@/hooks';
import { Card, CardContent, Badge, Button, Skeleton } from '@/components/ui';
import { RoundingHeader } from '@/components/rounding';
import { Users, Calendar, Clock, AlertCircle } from 'lucide-react';

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
  const { data: round, isLoading: roundLoading, error: roundError } = useRound(id);
  const { data: patientList, isLoading: patientsLoading } = useRoundingPatients(id);
  const { data: floors } = useFloors();

  const startRound = useStartRound();
  const pauseRound = usePauseRound();
  const resumeRound = useResumeRound();
  const completeRound = useCompleteRound();
  const cancelRound = useCancelRound();

  const isMutating =
    startRound.isPending ||
    pauseRound.isPending ||
    resumeRound.isPending ||
    completeRound.isPending ||
    cancelRound.isPending;

  const floorName = floors?.find((f) => f.id === round?.floorId)?.name;

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

        {round.status === 'IN_PROGRESS' && patientList && (
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

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Patient List</h2>
              <p className="text-sm text-muted-foreground">Patients to visit during this round</p>
            </div>
            {patientsLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !patientList || patientList.patients.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No patients assigned to this round.
              </div>
            ) : (
              <div className="divide-y">
                {patientList.patients.map((patient, index) => (
                  <div
                    key={patient.admissionId}
                    className={`p-4 flex items-center justify-between ${
                      patient.isVisited ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{patient.patient.name}</span>
                          <Badge variant="outline">
                            {patient.bed.roomNumber}-{patient.bed.bedNumber}
                          </Badge>
                          {patient.isVisited && <Badge variant="success">Visited</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {patient.admission.diagnosis || 'No diagnosis'} | Day{' '}
                          {patient.admission.admissionDays}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {patient.latestVitals && (
                        <div className="text-sm text-muted-foreground hidden md:flex gap-3">
                          {patient.latestVitals.temperature && (
                            <span>T: {patient.latestVitals.temperature}C</span>
                          )}
                          {patient.latestVitals.bloodPressure && (
                            <span>BP: {patient.latestVitals.bloodPressure}</span>
                          )}
                          {patient.latestVitals.oxygenSaturation && (
                            <span>SpO2: {patient.latestVitals.oxygenSaturation}%</span>
                          )}
                          {patient.latestVitals.hasAlert && (
                            <Badge variant="destructive">Alert</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
