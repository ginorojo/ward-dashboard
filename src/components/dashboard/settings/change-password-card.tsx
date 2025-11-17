'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { changePasswordSchema } from '@/lib/schemas';

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordCard({ t }: { t: (key: string) => string }) {
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: ChangePasswordFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('settings.passwordUpdateError'),
      });
      return;
    }

    try {
      await updatePassword(user, data.newPassword);
      toast({
        title: t('common.success'),
        description: t('settings.passwordUpdateSuccess'),
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message || t('settings.passwordUpdateError'),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.changePassword')}</CardTitle>
        <CardDescription>{t('settings.changePasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.newPassword')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.confirmNewPassword')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.updatePassword')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
