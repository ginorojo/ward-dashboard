'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { reunionSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

type ReunionFormValues = z.infer<typeof reunionSchema>;

interface ReunionFormProps {
  onSubmit: (data: ReunionFormValues) => Promise<void>;
  defaultValues?: Partial<ReunionFormValues>;
  t: (key: string) => string;
}

export default function ReunionForm({ onSubmit, defaultValues, t }: ReunionFormProps) {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
    
  const form = useForm<ReunionFormValues>({
    resolver: zodResolver(reunionSchema),
    defaultValues: defaultValues || {
      reason: '',
      participants: '',
      scheduledAt: new Date(),
      time: format(new Date(), 'HH:mm'),
    },
  });

  const { isSubmitting } = form.formState;

  const handleFormSubmit = (data: ReunionFormValues) => {
    const [hours, minutes] = data.time.split(':').map(Number);
    const combinedDateTime = new Date(data.scheduledAt);
    combinedDateTime.setHours(hours, minutes);

    onSubmit({ ...data, scheduledAt: combinedDateTime });
  };
  
  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('reuniones.reason')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('reuniones.reasonPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="participants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('reuniones.participants')}</FormLabel>
              <FormControl>
                <Input placeholder={t('reuniones.participantsPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }) => (
              <FormItem className="flex flex-col flex-1">
                <FormLabel>{t('common.date')}</FormLabel>
                {isMobile ? (
                  <Input 
                    type="date"
                    value={format(field.value || new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => {
                        const dateString = e.target.value;
                        const [year, month, day] = dateString.split('-').map(Number);
                        const localDate = new Date(year, month - 1, day);
                        field.onChange(localDate);
                    }}
                    className="w-full"
                  />
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>{t('interviews.pickADate')}</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem className='flex-1'>
                    <FormLabel>{t('interviews.time')}</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? t('common.save') : t('common.create')}
        </Button>
      </form>
    </Form>
  );
}
