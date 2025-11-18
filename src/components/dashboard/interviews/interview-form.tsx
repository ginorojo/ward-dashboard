'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { interviewSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

type InterviewFormValues = z.infer<typeof interviewSchema>;

interface InterviewFormProps {
  onSubmit: (data: InterviewFormValues) => Promise<void>;
  defaultValues?: Partial<InterviewFormValues>;
  t: (key: string) => string;
}

export default function InterviewForm({ onSubmit, defaultValues, t }: InterviewFormProps) {
  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: defaultValues || {
      personInterviewed: '',
      interviewer: '',
      purpose: '',
      scheduledDate: new Date(),
      scheduledTime: format(new Date(), 'HH:mm'),
      status: 'pending',
    },
  });

  const { isSubmitting } = form.formState;

  const handleFormSubmit = (data: InterviewFormValues) => {
    const [hours, minutes] = data.scheduledTime.split(':').map(Number);
    const combinedDateTime = new Date(data.scheduledDate);
    combinedDateTime.setHours(hours, minutes);

    onSubmit({ ...data, scheduledDate: combinedDateTime });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="personInterviewed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('interviews.personToBeInterviewed')}</FormLabel>
              <FormControl>
                <Input placeholder={t('interviews.nameOfMember')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interviewer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('interviews.interviewer')}</FormLabel>
              <FormControl>
                <Input placeholder={t('interviews.bishopCounselorEtc')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('interviews.purpose')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('interviews.templeRecommendEtc')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-center sm: flex-col">
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('common.date')}</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduledTime"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('interviews.time')}</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.status')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('interviews.selectStatus')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">{t('interviews.pending')}</SelectItem>
                  <SelectItem value="completed">{t('interviews.completed')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? t('common.save') : t('common.create')}
        </Button>
      </form>
    </Form>
  );
}
