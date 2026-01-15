'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePatients, useDebounce } from '@/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  LegacySelect,
  Skeleton,
} from '@/components/ui';
import { Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import type { FindPatientsParams, Gender } from '@/types';

const genderOptions = [
  { value: '', label: 'All Genders' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];

const sortOptions = [
  { value: 'createdAt', label: 'Registration Date' },
  { value: 'name', label: 'Name' },
  { value: 'patientNumber', label: 'Patient Number' },
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR');
}

function formatGender(gender: Gender): string {
  return gender === 'MALE' ? 'Male' : 'Female';
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [gender, setGender] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  const debouncedSearch = useDebounce(searchQuery, 300);

  const params: FindPatientsParams = {
    search: debouncedSearch || undefined,
    gender: (gender as Gender) || undefined,
    sortBy,
    sortOrder,
    page,
    limit,
  };

  const { data, isLoading, error } = usePatients(params);

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patient List</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or patient number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-40">
              <LegacySelect
                options={genderOptions}
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-full md:w-48">
              <LegacySelect
                options={sortOptions}
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">
              Failed to load patients. Please try again.
            </div>
          ) : data?.data.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No patients found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Patient Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-28">Birth Date</TableHead>
                  <TableHead className="w-24">Gender</TableHead>
                  <TableHead className="w-28">Blood Type</TableHead>
                  <TableHead className="w-36">Phone</TableHead>
                  <TableHead className="w-32">Registration</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-mono text-sm">{patient.patientNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(patient.birthDate)}</TableCell>
                    <TableCell>
                      <Badge variant={patient.gender === 'MALE' ? 'default' : 'secondary'}>
                        {formatGender(patient.gender)}
                      </Badge>
                    </TableCell>
                    <TableCell>{patient.bloodType || '-'}</TableCell>
                    <TableCell>{patient.phone || '-'}</TableCell>
                    <TableCell>{formatDate(patient.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/patients/${patient.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total}{' '}
            patients
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
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
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
