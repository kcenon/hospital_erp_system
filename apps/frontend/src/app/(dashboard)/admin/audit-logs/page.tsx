'use client';

import { useState } from 'react';
import { useLoginHistory, useAccessLogs, useChangeLogs } from '@/hooks';
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
import { ChevronLeft, ChevronRight, History, FileText, Database } from 'lucide-react';
import type { AuditAction } from '@/types';

type TabType = 'login' | 'access' | 'change';

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'READ', label: 'Read' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
];

const loginStatusOptions = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Success' },
  { value: 'false', label: 'Failed' },
];

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [page, setPage] = useState(1);
  const limit = 20;

  const defaultDates = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [loginSuccess, setLoginSuccess] = useState('');
  const [accessAction, setAccessAction] = useState('');
  const [changeAction, setChangeAction] = useState('');
  const [changeTable, setChangeTable] = useState('');

  const loginHistory = useLoginHistory({
    success: loginSuccess ? loginSuccess === 'true' : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  });

  const accessLogs = useAccessLogs({
    action: (accessAction as AuditAction) || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  });

  const changeLogs = useChangeLogs({
    tableName: changeTable || undefined,
    action: (changeAction as AuditAction) || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const tabs = [
    { id: 'login' as const, label: 'Login History', icon: History },
    { id: 'access' as const, label: 'Access Logs', icon: FileText },
    { id: 'change' as const, label: 'Change Logs', icon: Database },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'login':
        return loginHistory;
      case 'access':
        return accessLogs;
      case 'change':
        return changeLogs;
    }
  };

  const currentQuery = getCurrentData();
  const totalPages = currentQuery.data?.totalPages ?? 0;
  const total = currentQuery.data?.total ?? 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {activeTab === 'login' && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <LegacySelect
                  options={loginStatusOptions}
                  value={loginSuccess}
                  onChange={(e) => {
                    setLoginSuccess(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            )}
            {activeTab === 'access' && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Action</label>
                <LegacySelect
                  options={actionOptions}
                  value={accessAction}
                  onChange={(e) => {
                    setAccessAction(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            )}
            {activeTab === 'change' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Action</label>
                  <LegacySelect
                    options={actionOptions}
                    value={changeAction}
                    onChange={(e) => {
                      setChangeAction(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Table Name</label>
                  <Input
                    placeholder="e.g. patients"
                    value={changeTable}
                    onChange={(e) => {
                      setChangeTable(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {currentQuery.isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : currentQuery.error ? (
            <div className="p-6 text-center text-destructive">
              Failed to load audit logs. Please try again.
            </div>
          ) : (currentQuery.data?.data.length ?? 0) === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No logs found.</div>
          ) : (
            <>
              {activeTab === 'login' && loginHistory.data && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser / OS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Failure Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.data.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.username}</TableCell>
                        <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                        <TableCell>{log.deviceType || '-'}</TableCell>
                        <TableCell className="text-xs">
                          {[log.browser, log.os].filter(Boolean).join(' / ') || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.success ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(log.loginAt)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.failureReason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {activeTab === 'access' && accessLogs.data && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Method / Path</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.data.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.username}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.action === 'DELETE'
                                ? 'destructive'
                                : log.action === 'CREATE'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.resourceType}
                          {log.resourceId && (
                            <span className="text-xs text-muted-foreground ml-1">
                              #{log.resourceId}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.requestMethod} {log.requestPath}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                        <TableCell>
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.success ? 'OK' : log.errorCode || 'Error'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {activeTab === 'change' && changeLogs.data && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Changed Fields</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeLogs.data.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.username}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.action === 'DELETE'
                                ? 'destructive'
                                : log.action === 'CREATE'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.tableName}</TableCell>
                        <TableCell className="font-mono text-xs">{log.recordId}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap max-w-48">
                            {log.changedFields.slice(0, 3).map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                            {log.changedFields.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{log.changedFields.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-32 truncate">
                          {log.changeReason || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
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
