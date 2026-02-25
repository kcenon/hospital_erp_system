'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRecordIO } from '@/hooks/use-intake-output';

interface IORecordFormProps {
  admissionId: string;
  onSuccess?: () => void;
}

export function IORecordForm({ admissionId, onSuccess }: IORecordFormProps) {
  const recordMutation = useRecordIO(admissionId);
  const [showSuccess, setShowSuccess] = useState(false);

  const now = new Date();
  const [recordDate, setRecordDate] = useState(now.toISOString().slice(0, 10));
  const [recordTime, setRecordTime] = useState(now.toISOString().slice(0, 16));

  const [oralIntake, setOralIntake] = useState('');
  const [ivIntake, setIvIntake] = useState('');
  const [tubeFeeding, setTubeFeeding] = useState('');
  const [otherIntake, setOtherIntake] = useState('');

  const [urineOutput, setUrineOutput] = useState('');
  const [stoolOutput, setStoolOutput] = useState('');
  const [vomitOutput, setVomitOutput] = useState('');
  const [drainageOutput, setDrainageOutput] = useState('');
  const [otherOutput, setOtherOutput] = useState('');

  const [notes, setNotes] = useState('');

  const parseNum = (val: string): number | undefined => {
    const n = parseInt(val, 10);
    return isNaN(n) ? undefined : n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await recordMutation.mutateAsync({
        recordDate,
        recordTime: recordTime ? new Date(recordTime).toISOString() : new Date().toISOString(),
        oralIntake: parseNum(oralIntake),
        ivIntake: parseNum(ivIntake),
        tubeFeeding: parseNum(tubeFeeding),
        otherIntake: parseNum(otherIntake),
        urineOutput: parseNum(urineOutput),
        stoolOutput: parseNum(stoolOutput),
        vomitOutput: parseNum(vomitOutput),
        drainageOutput: parseNum(drainageOutput),
        otherOutput: parseNum(otherOutput),
        notes: notes.trim() || undefined,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setOralIntake('');
        setIvIntake('');
        setTubeFeeding('');
        setOtherIntake('');
        setUrineOutput('');
        setStoolOutput('');
        setVomitOutput('');
        setDrainageOutput('');
        setOtherOutput('');
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
        <span className="font-medium">I/O recorded successfully</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recordDate">Date</Label>
          <Input
            id="recordDate"
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recordTime">Time</Label>
          <Input
            id="recordTime"
            type="datetime-local"
            value={recordTime}
            onChange={(e) => setRecordTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2 text-blue-600">Intake (mL)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label htmlFor="oralIntake" className="text-xs">
              Oral
            </Label>
            <Input
              id="oralIntake"
              type="number"
              min="0"
              value={oralIntake}
              onChange={(e) => setOralIntake(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ivIntake" className="text-xs">
              IV
            </Label>
            <Input
              id="ivIntake"
              type="number"
              min="0"
              value={ivIntake}
              onChange={(e) => setIvIntake(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tubeFeeding" className="text-xs">
              Tube
            </Label>
            <Input
              id="tubeFeeding"
              type="number"
              min="0"
              value={tubeFeeding}
              onChange={(e) => setTubeFeeding(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="otherIntake" className="text-xs">
              Other
            </Label>
            <Input
              id="otherIntake"
              type="number"
              min="0"
              value={otherIntake}
              onChange={(e) => setOtherIntake(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2 text-orange-600">Output (mL)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label htmlFor="urineOutput" className="text-xs">
              Urine
            </Label>
            <Input
              id="urineOutput"
              type="number"
              min="0"
              value={urineOutput}
              onChange={(e) => setUrineOutput(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="stoolOutput" className="text-xs">
              Stool
            </Label>
            <Input
              id="stoolOutput"
              type="number"
              min="0"
              value={stoolOutput}
              onChange={(e) => setStoolOutput(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="vomitOutput" className="text-xs">
              Vomit
            </Label>
            <Input
              id="vomitOutput"
              type="number"
              min="0"
              value={vomitOutput}
              onChange={(e) => setVomitOutput(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="drainageOutput" className="text-xs">
              Drainage
            </Label>
            <Input
              id="drainageOutput"
              type="number"
              min="0"
              value={drainageOutput}
              onChange={(e) => setDrainageOutput(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="otherOutput" className="text-xs">
              Other
            </Label>
            <Input
              id="otherOutput"
              type="number"
              min="0"
              value={otherOutput}
              onChange={(e) => setOtherOutput(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ioNotes">Notes</Label>
        <Textarea
          id="ioNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      {recordMutation.error && (
        <p className="text-sm text-destructive">
          {recordMutation.error instanceof Error
            ? recordMutation.error.message
            : 'Failed to record I/O'}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={recordMutation.isPending}>
          {recordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record I/O
        </Button>
      </div>
    </form>
  );
}
