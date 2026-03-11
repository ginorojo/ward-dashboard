
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { meetingNoteSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type NoteFormValues = z.infer<typeof meetingNoteSchema>;

interface NoteFormProps {
  onSubmit: (data: NoteFormValues) => Promise<void>;
  defaultValues?: Partial<NoteFormValues>;
  t: (key: string) => string;
}

export default function NoteForm({ onSubmit, defaultValues, t }: NoteFormProps) {
    const isMobile = useIsMobile();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(meetingNoteSchema),
    defaultValues: defaultValues || {
      date: new Date(),
      type: 'bishopric',
      otherType: '',
      content: '',
    },
  });

  const { isSubmitting, watch } = form.formState;
  const selectedType = form.watch('type');
  
  if (!isClient) {
    return null;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('bishopricMeeting.noteDate')}</FormLabel>
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('bishopricMeeting.noteType')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('bishopricMeeting.selectType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bishopric">{t('bishopricMeeting.type_bishopric')}</SelectItem>
                  <SelectItem value="ward_council">{t('bishopricMeeting.type_ward_council')}</SelectItem>
                  <SelectItem value="other">{t('bishopricMeeting.type_other')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === 'other' && (
          <FormField
            control={form.control}
            name="otherType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('bishopricMeeting.specifyOther')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('bishopricMeeting.specifyOther')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('bishopricMeeting.noteContent')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('bishopricMeeting.decisionsAssignmentsEtc')} className="min-h-[200px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.content ? t('common.save') : t('common.create')}
        </Button>
      </form>
    </Form>
  );
}
