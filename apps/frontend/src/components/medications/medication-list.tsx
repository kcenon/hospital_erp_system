'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MedicationStatusBadge } from './medication-status-badge';
import {
  useMedicationHistory,
  useAdministerMedication,
  useHoldMedication,
  useRefuseMedication,
} from '@/hooks/use-medications';
import type { Medication, MedicationStatus } from '@/types';

interface MedicationListProps {
  admissionId: string;
}

type ActionType = 'administer' | 'hold' | 'refuse';

function formatRoute(route: string): string {
  return route;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_FILTERS: { value: MedicationStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ADMINISTERED', label: 'Administered' },
  { value: 'HELD', label: 'Held' },
  { value: 'REFUSED', label: 'Refused' },
  { value: 'MISSED', label: 'Missed' },
];

export function MedicationList({ admissionId }: MedicationListProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<MedicationStatus | ''>('');
  const [actionDialog, setActionDialog] = useState<{
    type: ActionType;
    medication: Medication;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  const { data, isLoading } = useMedicationHistory(admissionId, {
    status: statusFilter || undefined,
    page,
    limit: 10,
  });

  const administerMutation = useAdministerMedication(admissionId);
  const holdMutation = useHoldMedication(admissionId);
  const refuseMutation = useRefuseMedication(admissionId);

  const handleAction = async () => {
    if (!actionDialog) return;
    const { type, medication } = actionDialog;

    try {
      if (type === 'administer') {
        await administerMutation.mutateAsync({
          medicationId: medication.id,
          data: { notes: actionNotes.trim() || undefined },
        });
      } else if (type === 'hold') {
        await holdMutation.mutateAsync({
          medicationId: medication.id,
          reason: actionReason.trim(),
        });
      } else if (type === 'refuse') {
        await refuseMutation.mutateAsync({
          medicationId: medication.id,
          reason: actionReason.trim(),
        });
      }
      setActionDialog(null);
      setActionReason('');
      setActionNotes('');
    } catch {
      // Error handled by React Query
    }
  };

  const isActionPending =
    administerMutation.isPending || holdMutation.isPending || refuseMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const medications = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((sf) => (
          <Button
            key={sf.value}
            variant={statusFilter === sf.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter(sf.value);
              setPage(1);
            }}
          >
            {sf.label}
          </Button>
        ))}
      </div>

      {medications.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No medications found.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((med) => (
                <TableRow key={med.id}>
                  <TableCell className="font-medium">{med.medicationName}</TableCell>
                  <TableCell>{med.dosage}</TableCell>
                  <TableCell>{formatRoute(med.route)}</TableCell>
                  <TableCell>{med.frequency || '-'}</TableCell>
                  <TableCell>{formatDateTime(med.scheduledTime)}</TableCell>
                  <TableCell>
                    <MedicationStatusBadge status={med.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {med.status === 'SCHEDULED' && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setActionDialog({ type: 'administer', medication: med })}
                        >
                          Give
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActionDialog({ type: 'hold', medication: med })}
                        >
                          Hold
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActionDialog({ type: 'refuse', medication: med })}
                        >
                          Refuse
                        </Button>
                      </div>
                    )}
                    {med.status === 'ADMINISTERED' && (
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(med.administeredAt)}
                      </span>
                    )}
                    {(med.status === 'HELD' || med.status === 'REFUSED') && med.holdReason && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px] inline-block">
                        {med.holdReason}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'administer' && 'Administer Medication'}
              {actionDialog?.type === 'hold' && 'Hold Medication'}
              {actionDialog?.type === 'refuse' && 'Record Refusal'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.medication.medicationName} — {actionDialog?.medication.dosage} (
              {actionDialog?.medication.route})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionDialog?.type === 'administer' && (
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Notes (optional)</Label>
                <Textarea
                  id="adminNotes"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Patient tolerated well..."
                  rows={2}
                />
              </div>
            )}

            {(actionDialog?.type === 'hold' || actionDialog?.type === 'refuse') && (
              <div className="space-y-2">
                <Label htmlFor="actionReason">Reason *</Label>
                <Input
                  id="actionReason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    actionDialog?.type === 'hold'
                      ? 'e.g., Patient NPO for procedure'
                      : 'e.g., Patient refuses due to nausea'
                  }
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                isActionPending ||
                ((actionDialog?.type === 'hold' || actionDialog?.type === 'refuse') &&
                  !actionReason.trim())
              }
              variant={actionDialog?.type === 'refuse' ? 'destructive' : 'default'}
            >
              {isActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
