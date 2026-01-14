'use client';

import { useState, useCallback } from 'react';
import { usePatientSearch, useDebounce } from '@/hooks';
import { Input, Skeleton } from '@/components/ui';
import { Search, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types';

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
  placeholder?: string;
  className?: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR');
}

export function PatientSearch({
  onSelect,
  placeholder = 'Search patient by name or number...',
  className,
}: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const { data: patients, isLoading } = usePatientSearch(debouncedQuery);

  const handleSelect = useCallback(
    (patient: Patient) => {
      onSelect(patient);
      setQuery('');
      setIsOpen(false);
    },
    [onSelect],
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-auto rounded-md border bg-popover shadow-md">
          {isLoading ? (
            <div className="p-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No patients found.</div>
          ) : (
            <ul className="py-1">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                    onClick={() => handleSelect(patient)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{patient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {patient.patientNumber} | {formatDate(patient.birthDate)}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
