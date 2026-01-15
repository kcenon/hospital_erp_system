'use client';

import { useState } from 'react';
import { useRecordVitalSign } from '@/hooks';
import { useFormWithZod } from '@/hooks/use-form-with-zod';
import {
  vitalSignSchema,
  checkAbnormalValues,
  type VitalSignFormData,
} from '@/lib/validations/vital-sign';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

interface VitalSignsFormProps {
  admissionId: string;
  onSuccess?: () => void;
}

export function VitalSignsForm({ admissionId, onSuccess }: VitalSignsFormProps) {
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pendingData, setPendingData] = useState<VitalSignFormData | null>(null);

  const { mutate, isPending, isSuccess, reset } = useRecordVitalSign(admissionId);

  const form = useFormWithZod<VitalSignFormData>({
    schema: vitalSignSchema,
    defaultValues: {
      temperature: null,
      systolicBp: null,
      diastolicBp: null,
      pulseRate: null,
      respiratoryRate: null,
      oxygenSaturation: null,
      bloodGlucose: null,
      painScore: null,
      consciousness: null,
      notes: null,
    },
  });

  function parseNumber(value: string): number | null {
    if (!value || value.trim() === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  function parseInteger(value: string): number | null {
    if (!value || value.trim() === '') return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }

  function handleSubmitCheck(data: VitalSignFormData) {
    const abnormalWarnings = checkAbnormalValues(data);

    if (abnormalWarnings.length > 0) {
      setWarnings(abnormalWarnings);
      setPendingData(data);
      setShowWarningDialog(true);
    } else {
      submitData(data);
    }
  }

  function submitData(data: VitalSignFormData) {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== ''),
    );

    mutate(cleanData, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
        setTimeout(() => reset(), 2000);
      },
    });
  }

  function handleConfirmSubmit() {
    setShowWarningDialog(false);
    if (pendingData) {
      submitData(pendingData);
      setPendingData(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Record Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitCheck)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="36.5"
                          inputMode="decimal"
                          className="text-lg h-12"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseNumber(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Blood Pressure (mmHg)</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="systolicBp"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="120"
                              inputMode="numeric"
                              className="text-lg h-12"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(parseInteger(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <span className="text-muted-foreground font-medium">/</span>
                    <FormField
                      control={form.control}
                      name="diastolicBp"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="80"
                              inputMode="numeric"
                              className="text-lg h-12"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(parseInteger(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="pulseRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pulse (bpm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="75"
                          inputMode="numeric"
                          className="text-lg h-12"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInteger(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="respiratoryRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Respiratory Rate (/min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="16"
                          inputMode="numeric"
                          className="text-lg h-12"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInteger(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="oxygenSaturation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SpO2 (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="98"
                          inputMode="numeric"
                          className="text-lg h-12"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInteger(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bloodGlucose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Glucose (mg/dL)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          inputMode="numeric"
                          className="text-lg h-12"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInteger(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="painScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pain Score (0-10)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          placeholder="0"
                          inputMode="numeric"
                          className="text-lg h-12"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInteger(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consciousness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consciousness (AVPU)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ALERT">Alert</SelectItem>
                          <SelectItem value="VERBAL">Verbal</SelectItem>
                          <SelectItem value="PAIN">Pain</SelectItem>
                          <SelectItem value="UNRESPONSIVE">Unresponsive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Additional notes..."
                        className="h-12"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Recording...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Recorded!
                  </>
                ) : (
                  'Record Vital Signs'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Abnormal Values Detected
            </DialogTitle>
            <DialogDescription>
              The following abnormal values were detected. Please confirm before submitting.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit}>Confirm & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
