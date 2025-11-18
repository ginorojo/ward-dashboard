'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sacramentMeetingSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SacramentMeeting } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type AgendaFormValues = z.infer<typeof sacramentMeetingSchema>;

interface AgendaFormProps {
  onSave: (data: AgendaFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: SacramentMeeting | null;
  t: (key: string) => string;
}

export default function AgendaForm({ onSave, onDelete, initialData, t }: AgendaFormProps) {
  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(sacramentMeetingSchema),
    defaultValues: initialData
      ? { ...initialData, date: initialData.date.toDate(), speakers: initialData.speakers || ["","","",""], asuntosDelBarrio: initialData.asuntosDelBarrio || [] }
      : {
          date: new Date(),
          preside: '',
          dirige: '',
          pianist: '',
          musicDirector: '',
          authorities: '',
          hymnSacramental: { name: '', number: undefined },
          speakers: ['', '', '', ''],
          hymnFinal: { name: '', number: undefined },
          closingPrayer: '',
          asuntosDelBarrio: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'asuntosDelBarrio',
  });

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>{t('sacramentMeeting.meetingDate')}</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={'outline'}
                                className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                >
                                {field.value ? format(field.value, 'PPP') : <span>{t('interviews.pickADate')}</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField control={form.control} name="preside" render={({ field }) => (<FormItem><FormLabel>{t('sacramentMeeting.presiding')}</FormLabel><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dirige" render={({ field }) => (<FormItem><FormLabel>{t('sacramentMeeting.conducting')}</FormLabel><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="pianist" render={({ field }) => (<FormItem><FormLabel>{t('sacramentMeeting.pianist')}</FormLabel><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="musicDirector" render={({ field }) => (<FormItem><FormLabel>{t('sacramentMeeting.musicDirector')}</FormLabel><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="authorities" render={({ field }) => (<FormItem><FormLabel>{t('sacramentMeeting.visitingAuthorities')}</FormLabel><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Separator />

             <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('sacramentMeeting.wardBusiness')}</h3>
              {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-md items-end">
                  <FormField
                    control={form.control}
                    name={`asuntosDelBarrio.${index}.type`}
                    render={({ field }) => (
                      <FormItem className='flex-1'><FormLabel>{t('sacramentMeeting.type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder={t('sacramentMeeting.type')} /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="sostenimiento">{t('sacramentMeeting.sustaining')}</SelectItem><SelectItem value="relevo">{t('sacramentMeeting.release')}</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name={`asuntosDelBarrio.${index}.personName`} render={({ field }) => (<FormItem className='flex-1'><FormLabel>{t('common.name')}</FormLabel><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl></FormItem>)} />
                   <FormField control={form.control} name={`asuntosDelBarrio.${index}.calling`} render={({ field }) => (<FormItem className='flex-1'><FormLabel>{t('sacramentMeeting.calling')}</FormLabel><FormControl><Input placeholder={t('sacramentMeeting.calling')} {...field} /></FormControl></FormItem>)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ type: 'sostenimiento', personName: '', calling: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('sacramentMeeting.addBusiness')}
              </Button>
            </div>

            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2"><FormLabel>{t('sacramentMeeting.sacramentalHymn')}</FormLabel><div className="flex gap-2"><FormField control={form.control} name="hymnSacramental.number" render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="#" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="hymnSacramental.name" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl></FormItem>)} /></div></div>
            </div>

            <Separator />

             <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('sacramentMeeting.speakers')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(i => (
                    <FormField key={i} control={form.control} name={`speakers.${i}`} render={({ field }) => (<FormItem><FormLabel>{t('sacramentMeeting.speaker')} {i + 1}</FormLabel><FormControl><Input placeholder={t('common.name')} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                ))}
              </div>
            </div>

            <Separator />
            <div className="space-y-2"><FormLabel>{t('sacramentMeeting.closingHymn')}</FormLabel><div className="flex gap-2"><FormField control={form.control} name="hymnFinal.number" render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="#" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="hymnFinal.name" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl></FormItem>)} /></div></div>

            <FormField control={form.control} name="closingPrayer" render={({ field }) => (<FormItem><FormLabel>{t('sacramentMeeting.closingPrayer')}</FormLabel><FormControl><Input placeholder={t('common.name')} {...field} /></FormControl><FormMessage /></FormItem>)} />
            
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2 mt-6">
            {onDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isSubmitting}>
                            {t('sacramentMeeting.deleteAgenda')}
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('sacramentMeeting.deleteAgenda')}?</AlertDialogTitle>
                            <AlertDialogDescription>
                            {t('sacramentMeeting.deleteAgendaConfirm')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('sacramentMeeting.saveAgenda')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
