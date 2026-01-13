import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormProps, type FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';

interface UseFormWithZodOptions<T extends FieldValues>
  extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodType<T>;
}

export function useFormWithZod<T extends FieldValues>({
  schema,
  ...formOptions
}: UseFormWithZodOptions<T>) {
  return useForm<T>({
    ...formOptions,
    resolver: zodResolver(schema),
  });
}
