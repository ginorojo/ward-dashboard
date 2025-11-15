'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userSchema, createUserSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: CreateUserFormValues | EditUserFormValues) => Promise<void>;
  defaultValues?: Partial<CreateUserFormValues | EditUserFormValues>;
  isEditMode?: boolean;
  t: (key: string) => string;
}

export default function UserForm({ onSubmit, defaultValues, isEditMode = false, t }: UserFormProps) {
  const { user } = useUser();
  const isAdministrator = user?.email === 'ginorojoj@gmail.com';

  const form = useForm<CreateUserFormValues | EditUserFormValues>({
    resolver: zodResolver(isEditMode ? userSchema : createUserSchema),
    defaultValues: defaultValues || {
      name: '',
      email: '',
      password: '',
      role: 'secretary',
    },
  });

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('users.fullName')}</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.email')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEditMode && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.password')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.role')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.role')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isAdministrator && <SelectItem value="administrator">Administrador</SelectItem>}
                  <SelectItem value="bishop">{t('users.roleBishop')}</SelectItem>
                  <SelectItem value="counselor">{t('users.roleCounselor')}</SelectItem>
                  <SelectItem value="secretary">{t('users.roleSecretary')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? t('users.saveChanges') : t('users.createNewUser')}
        </Button>
      </form>
    </Form>
  );
}
