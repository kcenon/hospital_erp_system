'use client';

import { use } from 'react';
import Link from 'next/link';
import { usePatient, usePatientAdmissions } from '@/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Skeleton,
} from '@/components/ui';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react';
import type { Gender, AdmissionStatus } from '@/types';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR');
}

function formatGender(gender: Gender): string {
  return gender === 'MALE' ? 'Male' : 'Female';
}

function getStatusBadgeVariant(status: AdmissionStatus) {
  switch (status) {
    case 'ADMITTED':
      return 'success';
    case 'DISCHARGED':
      return 'secondary';
    case 'TRANSFERRED':
      return 'warning';
    default:
      return 'default';
  }
}

function formatAdmissionStatus(status: AdmissionStatus): string {
  switch (status) {
    case 'ADMITTED':
      return 'Admitted';
    case 'DISCHARGED':
      return 'Discharged';
    case 'TRANSFERRED':
      return 'Transferred';
    default:
      return status;
  }
}

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = use(params);
  const { data: patient, isLoading: isLoadingPatient, error: patientError } = usePatient(id);
  const { data: admissions, isLoading: isLoadingAdmissions } = usePatientAdmissions(id);

  if (isLoadingPatient) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Failed to load patient information</p>
            <Link href="/patients" className="mt-4">
              <Button variant="outline">Back to Patient List</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentAdmission = admissions?.find((a) => a.status === 'ADMITTED');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Patient Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{patient.name}</CardTitle>
                  <CardDescription className="font-mono">
                    {patient.patientNumber}
                  </CardDescription>
                </div>
              </div>
              {currentAdmission && (
                <Badge variant="success">Currently Admitted</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Birth Date</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(patient.birthDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">
                  <Badge variant={patient.gender === 'MALE' ? 'default' : 'secondary'}>
                    {formatGender(patient.gender)}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Type</p>
                <p className="font-medium">{patient.bloodType || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {patient.phone || '-'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {patient.address || '-'}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.emergencyContactName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{patient.emergencyContactPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relation</p>
                  <p className="font-medium">{patient.emergencyContactRelation || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              New Admission
            </Button>
            <Button className="w-full" variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              View Vitals
            </Button>
          </CardContent>
        </Card>
      </div>

      {patient.detail && (
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Medical History</p>
                <p className="font-medium whitespace-pre-wrap">
                  {patient.detail.medicalHistory || 'No records'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Allergies</p>
                <p className="font-medium whitespace-pre-wrap">
                  {patient.detail.allergies || 'None known'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Insurance Company</p>
                <p className="font-medium">
                  {patient.detail.insuranceCompany || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Insurance Type</p>
                <p className="font-medium">
                  {patient.detail.insuranceType || '-'}
                </p>
              </div>
              {patient.detail.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">
                    {patient.detail.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admission History</CardTitle>
          <CardDescription>
            {admissions?.length || 0} admission records
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingAdmissions ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !admissions || admissions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No admission history found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission Number</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Discharge Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissions.map((admission) => (
                  <TableRow key={admission.id}>
                    <TableCell className="font-mono">
                      {admission.admissionNumber}
                    </TableCell>
                    <TableCell>{formatDate(admission.admissionDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{admission.admissionType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {admission.diagnosis || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(admission.status)}>
                        {formatAdmissionStatus(admission.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admission.discharge
                        ? formatDate(admission.discharge.dischargeDate)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
