'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNursingNotes } from '@/hooks/use-nursing-notes';
import type { NoteType, NursingNote } from '@/types';

const NOTE_TYPE_FILTERS: { value: NoteType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'ASSESSMENT', label: 'Assessment' },
  { value: 'PROGRESS', label: 'Progress' },
  { value: 'PROCEDURE', label: 'Procedure' },
  { value: 'HANDOFF', label: 'Handoff' },
];

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NoteCard({ note }: { note: NursingNote }) {
  return (
    <Card className="relative">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{note.noteType}</Badge>
            {note.isSignificant && <Badge variant="destructive">Significant</Badge>}
          </div>
          <span className="text-xs text-muted-foreground">{formatDateTime(note.recordedAt)}</span>
        </div>

        {note.subjective && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Subjective</p>
            <p className="text-sm whitespace-pre-wrap">{note.subjective}</p>
          </div>
        )}

        {note.objective && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Objective</p>
            <p className="text-sm whitespace-pre-wrap">{note.objective}</p>
          </div>
        )}

        {note.assessment && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Assessment</p>
            <p className="text-sm whitespace-pre-wrap">{note.assessment}</p>
          </div>
        )}

        {note.plan && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Plan</p>
            <p className="text-sm whitespace-pre-wrap">{note.plan}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface NursingNoteListProps {
  admissionId: string;
}

export function NursingNoteList({ admissionId }: NursingNoteListProps) {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<NoteType | ''>('');

  const { data, isLoading } = useNursingNotes(admissionId, {
    noteType: typeFilter || undefined,
    page,
    limit: 10,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const notes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {NOTE_TYPE_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={typeFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTypeFilter(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No nursing notes found.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
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
    </div>
  );
}
