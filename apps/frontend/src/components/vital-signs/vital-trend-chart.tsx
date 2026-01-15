'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useVitalTrend } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface VitalTrendChartProps {
  admissionId: string;
}

type DateRange = '3' | '7' | '14';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VitalTrendChart({ admissionId }: VitalTrendChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>('7');

  const params = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(dateRange));

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [dateRange]);

  const { data: trendData, isLoading, error } = useVitalTrend(admissionId, params);

  const chartData = useMemo(() => {
    if (!trendData) return [];

    return trendData.labels.map((label, idx) => ({
      date: formatDate(label),
      rawDate: label,
      temperature: trendData.temperature[idx],
      systolicBp: trendData.systolicBp[idx],
      diastolicBp: trendData.diastolicBp[idx],
      pulseRate: trendData.pulseRate[idx],
      respiratoryRate: trendData.respiratoryRate[idx],
      oxygenSaturation: trendData.oxygenSaturation[idx],
    }));
  }, [trendData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Vital Signs Trend
        </CardTitle>
        <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 days</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-2" />
            <p>Failed to load trend data</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-2" />
            <p>No vital signs recorded in this period</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Temperature & SpO2 Chart */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Temperature & SpO2</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis
                    yAxisId="temp"
                    orientation="left"
                    domain={[35, 40]}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: '°C',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    yAxisId="spo2"
                    orientation="right"
                    domain={[85, 100]}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: '%',
                      angle: 90,
                      position: 'insideRight',
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature"
                    stroke="#ff7300"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    yAxisId="spo2"
                    type="monotone"
                    dataKey="oxygenSaturation"
                    name="SpO2"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Blood Pressure Chart */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Blood Pressure</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis
                    domain={[50, 200]}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: 'mmHg',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="systolicBp"
                    name="Systolic"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolicBp"
                    name="Diastolic"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pulse & Respiratory Rate Chart */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Pulse & Respiratory Rate
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis
                    yAxisId="pulse"
                    orientation="left"
                    domain={[40, 150]}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: 'bpm',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    yAxisId="resp"
                    orientation="right"
                    domain={[5, 35]}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: '/min',
                      angle: 90,
                      position: 'insideRight',
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="pulse"
                    type="monotone"
                    dataKey="pulseRate"
                    name="Pulse"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    yAxisId="resp"
                    type="monotone"
                    dataKey="respiratoryRate"
                    name="RR"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
