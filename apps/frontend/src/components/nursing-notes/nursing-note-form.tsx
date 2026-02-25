'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LegacySelect } from '@/components/ui/select';
import { useCreateNursingNote } from '@/hooks/use-nursing-notes';
import type { NoteType } from '@/types';

const NOTE_TYPE_OPTIONS = [
  { value: 'ASSESSMENT', label: 'Assessment' },
  { value: 'PROGRESS', label: 'Progress' },
  { value: 'PROCEDURE', label: 'Procedure' },
  { value: 'HANDOFF', label: 'Handoff' },
];

interface NursingNoteFormProps {
  admissionId: string;
  onSuccess?: () => void;
}

export function NursingNoteForm({ admissionId, onSuccess }: NursingNoteFormProps) {
  const createMutation = useCreateNursingNote(admissionId);
  const [showSuccess, setShowSuccess] = useState(false);

  const [noteType, setNoteType] = useState<NoteType>('PROGRESS');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [isSignificant, setIsSignificant] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        noteType,
        subjective: subjective.trim() || undefined,
        objective: objective.trim() || undefined,
        assessment: assessment.trim() || undefined,
        plan: plan.trim() || undefined,
        isSignificant,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSubjective('');
        setObjective('');
        setAssessment('');
        setPlan('');
        setIsSignificant(false);
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
        <span className="font-medium">Nursing note created successfully</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="noteType">Note Type</Label>
          <LegacySelect
            id="noteType"
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as NoteType)}
            options={NOTE_TYPE_OPTIONS}
          />
        </div>

        <div className="flex items-end space-x-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSignificant}
              onChange={(e) => setIsSignificant(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm font-medium">Significant for Handoff</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subjective">S - Subjective</Label>
        <Textarea
          id="subjective"
          value={subjective}
          onChange={(e) => setSubjective(e.target.value)}
          placeholder="Patient complaints and symptoms..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective">O - Objective</Label>
        <Textarea
          id="objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Observable findings..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assessment">A - Assessment</Label>
        <Textarea
          id="assessment"
          value={assessment}
          onChange={(e) => setAssessment(e.target.value)}
          placeholder="Nursing assessment..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">P - Plan</Label>
        <Textarea
          id="plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="Care plan..."
          rows={2}
        />
      </div>

      {createMutation.error && (
        <p className="text-sm text-destructive">
          {createMutation.error instanceof Error
            ? createMutation.error.message
            : 'Failed to create nursing note'}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Note
        </Button>
      </div>
    </form>
  );
}
