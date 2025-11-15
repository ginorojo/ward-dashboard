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
}

export default function AgendaForm({ onSave, onDelete, initialData }: AgendaFormProps) {
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
                        <FormLabel>Meeting Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={'outline'}
                                className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
                <FormField control={form.control} name="preside" render={({ field }) => (<FormItem><FormLabel>Presiding</FormLabel><FormControl><Input placeholder="Bishop Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dirige" render={({ field }) => (<FormItem><FormLabel>Conducting</FormLabel><FormControl><Input placeholder="Counselor Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="pianist" render={({ field }) => (<FormItem><FormLabel>Pianist</FormLabel><FormControl><Input placeholder="Member Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="musicDirector" render={({ field }) => (<FormItem><FormLabel>Music Director</FormLabel><FormControl><Input placeholder="Member Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="authorities" render={({ field }) => (<FormItem><FormLabel>Visiting Authorities (optional)</FormLabel><FormControl><Input placeholder="President Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Separator />

             <div className="space-y-4">
              <h3 className="text-lg font-medium">Ward Business</h3>
              {fields.map((item, index) => (
                <div key={item.id} className="flex items-end gap-2 p-3 border rounded-md">
                  <FormField
                    control={form.control}
                    name={`asuntosDelBarrio.${index}.type`}
                    render={({ field }) => (
                      <FormItem className='flex-1'><FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="sostenimiento">Sustaining</SelectItem><SelectItem value="relevo">Release</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name={`asuntosDelBarrio.${index}.personName`} render={({ field }) => (<FormItem className='flex-1'><FormLabel>Name</FormLabel><FormControl><Input placeholder="Person's Name" {...field} /></FormControl></FormItem>)} />
                   <FormField control={form.control} name={`asuntosDelBarrio.${index}.calling`} render={({ field }) => (<FormItem className='flex-1'><FormLabel>Calling</FormLabel><FormControl><Input placeholder="Calling Name" {...field} /></FormControl></FormItem>)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ type: 'sostenimiento', personName: '', calling: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Business
              </Button>
            </div>

            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2"><FormLabel>Sacramental Hymn</FormLabel><div className="flex gap-2"><FormField control={form.control} name="hymnSacramental.number" render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="#" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="hymnSacramental.name" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Hymn Name" {...field} /></FormControl></FormItem>)} /></div></div>
                 <div className="space-y-2"><FormLabel>Closing Hymn</FormLabel><div className="flex gap-2"><FormField control={form.control} name="hymnFinal.number" render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="#" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="hymnFinal.name" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Hymn Name" {...field} /></FormControl></FormItem>)} /></div></div>
            </div>

            <Separator />

             <div className="space-y-4">
              <h3 className="text-lg font-medium">Speakers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(i => (
                    <FormField key={i} control={form.control} name={`speakers.${i}`} render={({ field }) => (<FormItem><FormLabel>Speaker {i + 1}</FormLabel><FormControl><Input placeholder="Speaker Name" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                ))}
              </div>
            </div>

            <Separator />

            <FormField control={form.control} name="closingPrayer" render={({ field }) => (<FormItem><FormLabel>Closing Prayer</FormLabel><FormControl><Input placeholder="Member Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
            
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2 mt-6">
            {onDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isSubmitting}>
                            Delete Agenda
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Agenda?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this agenda.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Agenda
            </Button>
        </div>
      </form>
    </Form>
  );
}
