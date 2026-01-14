import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormProps, type FieldValues } from 'react-hook-form';
import type { ZodObject, ZodRawShape } from 'zod';

type UseFormWithZodOptions<T extends FieldValues> = Omit<UseFormProps<T>, 'resolver'> & {
  schema: ZodObject<ZodRawShape>;
};

export function useFormWithZod<T extends FieldValues>({
  schema,
  ...formOptions
}: UseFormWithZodOptions<T>) {
  return useForm<T>({
    ...formOptions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });
}
