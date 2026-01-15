'use client';

import { useState } from 'react';
import {
  useRounds,
  useFloors,
  useStartRound,
  usePauseRound,
  useResumeRound,
  useCompleteRound,
  useCreateRound,
} from '@/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LegacySelect,
  Button,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from '@/components/ui';
import { RoundingSessionCard } from '@/components/rounding';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FindRoundsParams, RoundStatus, RoundType, CreateRoundData } from '@/types';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const roundTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'MORNING', label: 'Morning' },
  { value: 'AFTERNOON', label: 'Afternoon' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'NIGHT', label: 'Night' },
];

export default function RoundingSessionsPage() {
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roundTypeFilter, setRoundTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoundData, setNewRoundData] = useState<Partial<CreateRoundData>>({
    roundType: 'MORNING',
    scheduledDate: new Date().toISOString().split('T')[0],
  });
  const limit = 12;

  const { data: floors, isLoading: floorsLoading } = useFloors();

  const params: FindRoundsParams = {
    floorId: selectedFloorId || undefined,
    status: (statusFilter as RoundStatus) || undefined,
    roundType: (roundTypeFilter as RoundType) || undefined,
    page,
    limit,
  };

  const { data, isLoading, error } = useRounds(params);
  const startRound = useStartRound();
  const pauseRound = usePauseRound();
  const resumeRound = useResumeRound();
  const completeRound = useCompleteRound();
  const createRound = useCreateRound();

  const floorOptions = [
    { value: '', label: 'All Floors' },
    ...(floors?.map((floor) => ({
      value: floor.id,
      label: floor.name,
    })) || []),
  ];

  const handleCreateRound = async () => {
    if (!newRoundData.floorId || !newRoundData.roundType || !newRoundData.scheduledDate) {
      return;
    }

    try {
      await createRound.mutateAsync({
        floorId: newRoundData.floorId,
        roundType: newRoundData.roundType as RoundType,
        scheduledDate: newRoundData.scheduledDate,
        scheduledTime: newRoundData.scheduledTime,
        leadDoctorId: 'current-user',
      });
      setIsCreateDialogOpen(false);
      setNewRoundData({
        roundType: 'MORNING',
        scheduledDate: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.error('Failed to create round:', err);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rounding Sessions</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              {floorsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <LegacySelect
                  options={floorOptions}
                  value={selectedFloorId}
                  onChange={(e) => {
                    setSelectedFloorId(e.target.value);
                    setPage(1);
                  }}
                />
              )}
            </div>
            <div className="w-full md:w-40">
              <LegacySelect
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-full md:w-40">
              <LegacySelect
                options={roundTypeOptions}
                value={roundTypeFilter}
                onChange={(e) => {
                  setRoundTypeFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center text-destructive">
            Failed to load rounding sessions. Please try again.
          </CardContent>
        </Card>
      ) : data?.data.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No rounding sessions found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map((round) => (
            <RoundingSessionCard
              key={round.id}
              round={round}
              onStart={(id) => startRound.mutate(id)}
              onPause={(id) => pauseRound.mutate(id)}
              onResume={(id) => resumeRound.mutate(id)}
              onComplete={(id) => completeRound.mutate(id)}
            />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total}{' '}
            sessions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Rounding Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              {floorsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <LegacySelect
                  options={
                    floors?.map((floor) => ({
                      value: floor.id,
                      label: floor.name,
                    })) || []
                  }
                  value={newRoundData.floorId || ''}
                  onChange={(e) =>
                    setNewRoundData((prev) => ({ ...prev, floorId: e.target.value }))
                  }
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="roundType">Round Type</Label>
              <LegacySelect
                options={[
                  { value: 'MORNING', label: 'Morning' },
                  { value: 'AFTERNOON', label: 'Afternoon' },
                  { value: 'EVENING', label: 'Evening' },
                  { value: 'NIGHT', label: 'Night' },
                ]}
                value={newRoundData.roundType || 'MORNING'}
                onChange={(e) =>
                  setNewRoundData((prev) => ({ ...prev, roundType: e.target.value as RoundType }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={newRoundData.scheduledDate || ''}
                onChange={(e) =>
                  setNewRoundData((prev) => ({ ...prev, scheduledDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Scheduled Time (Optional)</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={newRoundData.scheduledTime || ''}
                onChange={(e) =>
                  setNewRoundData((prev) => ({ ...prev, scheduledTime: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRound}
              disabled={!newRoundData.floorId || createRound.isPending}
            >
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
