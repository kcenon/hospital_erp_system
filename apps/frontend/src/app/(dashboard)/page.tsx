'use client';

import Link from 'next/link';
import { usePatients } from '@/hooks';
import { useFloors } from '@/hooks';
import { useRounds } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { Users, BedDouble, ClipboardList, FileBarChart, Activity, ArrowRight } from 'lucide-react';

function formatToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardHomePage() {
  const today = formatToday();

  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: floors, isLoading: floorsLoading } = useFloors();
  const { data: todayRounds, isLoading: roundsLoading } = useRounds({
    scheduledDateFrom: today,
    scheduledDateTo: today,
  });

  const totalPatients = patients?.total ?? 0;
  const totalFloors = floors?.length ?? 0;
  const activeRounds =
    todayRounds?.data?.filter((r) => r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS')
      .length ?? 0;
  const completedRounds = todayRounds?.data?.filter((r) => r.status === 'COMPLETED').length ?? 0;

  const summaryCards = [
    {
      title: 'Total Patients',
      value: totalPatients,
      icon: Users,
      href: '/patients',
      loading: patientsLoading,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Floors',
      value: totalFloors,
      icon: BedDouble,
      href: '/rooms',
      loading: floorsLoading,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Active Rounds',
      value: activeRounds,
      icon: ClipboardList,
      href: '/rounding',
      loading: roundsLoading,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Completed Today',
      value: completedRounds,
      icon: Activity,
      href: '/rounding',
      loading: roundsLoading,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const quickLinks = [
    { label: 'Patient List', href: '/patients', icon: Users },
    { label: 'Room Dashboard', href: '/rooms', icon: BedDouble },
    { label: 'Rounding', href: '/rounding', icon: ClipboardList },
    { label: 'Daily Reports', href: '/reports/daily-reports', icon: FileBarChart },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Hospital inpatient management overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    {card.loading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold mt-1">{card.value}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${card.bg}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Rounds</CardTitle>
          </CardHeader>
          <CardContent>
            {roundsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : todayRounds?.data && todayRounds.data.length > 0 ? (
              <div className="space-y-2">
                {todayRounds.data.slice(0, 5).map((round) => (
                  <Link
                    key={round.id}
                    href={`/rounding/${round.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">{round.roundNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {round.roundType} &middot; {round.scheduledDate}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        round.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : round.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700'
                            : round.status === 'SCHEDULED'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {round.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No rounds scheduled for today
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
