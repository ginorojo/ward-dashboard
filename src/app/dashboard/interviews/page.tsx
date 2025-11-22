'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { Interview } from '@/lib/types';
import { addDocument, deleteDocument, getCollection, updateDocument } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarPlus, CheckCircle, ExternalLink } from 'lucide-react';
import { DataTable } from '@/components/dashboard/interviews/data-table';
import { columns } from '@/components/dashboard/interviews/columns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InterviewForm from '@/components/dashboard/interviews/interview-form';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { interviewSchema } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type InterviewFormValues = z.infer<typeof interviewSchema>;

const DeleteConfirmationDialog = ({ open, onOpenChange, interview, onConfirm, addedToCalendar, t }: { open: boolean, onOpenChange: (open: boolean) => void, interview: Interview | null, onConfirm: () => void, addedToCalendar: string[], t: (key: string) => string }) => {
    if (!interview) return null;

    const isAdded = addedToCalendar.includes(interview.id);
    const eventDate = interview.scheduledDate.toDate();
    const calendarLink = `https://calendar.google.com/calendar/r/day/${eventDate.getFullYear()}/${eventDate.getMonth() + 1}/${eventDate.getDate()}`;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('interviews.deleteConfirmTitle')}</AlertDialogTitle>
                    {isAdded ? (
                        <AlertDialogDescription>
                            {t('interviews.deleteConfirmDescriptionWithCalendar')}
                            <Button variant="link" asChild className="p-0 h-auto mt-2">
                                <a href={calendarLink} target="_blank" rel="noopener noreferrer">
                                    {t('interviews.openGoogleCalendar')} <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </AlertDialogDescription>
                    ) : (
                        <AlertDialogDescription>
                            {t('interviews.deleteConfirmDescription')}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
                        {t('common.delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


export default function InterviewsPage() {
  const { firestore, user } = useFirebase();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [addedToCalendar, setAddedToCalendar] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('addedInterviews');
    if (stored) {
      setAddedToCalendar(JSON.parse(stored));
    }
  }, []);

  const handleAddToCalendar = (interviewId: string) => {
    const newAdded = [...addedToCalendar, interviewId];
    setAddedToCalendar(newAdded);
    localStorage.setItem('addedInterviews', JSON.stringify(newAdded));
  };


  const fetchInterviews = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const interviewList = await getCollection<Interview>(firestore, 'interviews', { field: 'scheduledDate', direction: 'desc' });
      setInterviews(interviewList);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to fetch interviews.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [firestore]);

  const handleFormSubmit = async (data: InterviewFormValues) => {
    if (!user || !firestore) return;
    try {
      if (editingInterview) {
        await updateDocument(firestore, 'interviews', editingInterview.id, data, user.uid, 'interview');
        toast({ title: t('common.success'), description: t('interviews.interviewUpdated') });
      } else {
        await addDocument(firestore, 'interviews', data, user.uid, 'interview');
        toast({ title: t('common.success'), description: t('interviews.interviewCreated') });
      }
      setIsFormOpen(false);
      setEditingInterview(null);
      fetchInterviews();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to save interview.' });
    }
  };

  const openEditForm = (interview: Interview) => {
    setEditingInterview(interview);
    setIsFormOpen(true);
  };
  
  const openNewForm = () => {
    setEditingInterview(null);
    setIsFormOpen(true);
  }

  const openDeleteConfirmation = (interview: Interview) => {
    setInterviewToDelete(interview);
    setIsDeleteAlertOpen(true);
  };
  
  const confirmDelete = () => {
    if (!user || !firestore || !interviewToDelete) return;
    deleteDocument(firestore, 'interviews', interviewToDelete.id, user.uid, 'interview');
    toast({ title: t('common.success'), description: t('interviews.interviewDeleted') });
    fetchInterviews();
    setIsDeleteAlertOpen(false);
    setInterviewToDelete(null);
  };


  const handleStatusToggle = (interview: Interview) => {
      if (!user || !firestore) return;
      const newStatus = interview.status === 'pending' ? 'completed' : 'pending';
      updateDocument(firestore, 'interviews', interview.id, { status: newStatus }, user.uid, 'interview');
      toast({ title: t('common.success'), description: t('interviews.statusUpdated')});
      fetchInterviews();
  };
  
  const createGoogleCalendarLink = (interview: Interview) => {
    const startTime = interview.scheduledDate.toDate();
    const endTime = new Date(startTime.getTime() + 30 * 60000); // Assume 30 min duration

    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `Entrevista: ${interview.personInterviewed}`);
    url.searchParams.set('dates', `${formatDate(startTime)}/${formatDate(endTime)}`);
    url.searchParams.set('details', `Propósito: ${interview.purpose}\nEntrevistador: ${interview.interviewer}`);
    return url.toString();
  }

  const tableColumns = useMemo(() => columns({ openEditForm, handleDelete: openDeleteConfirmation, handleStatusToggle, createGoogleCalendarLink, t, addedToCalendar, onAddToCalendar: handleAddToCalendar }), [interviews, t, addedToCalendar]);

  const dialogTitle = editingInterview ? t('interviews.editInterview') : t('interviews.createNewInterview');
  const formDefaultValues = editingInterview ? {
    ...editingInterview,
    scheduledDate: editingInterview.scheduledDate.toDate(),
    scheduledTime: format(editingInterview.scheduledDate.toDate(), 'HH:mm'),
  } : undefined;

  const renderMobileInterviews = () => (
    <div className="space-y-4">
      {interviews.map(interview => {
        const isAdded = addedToCalendar.includes(interview.id);
        return (
        <Card key={interview.id} className='flex flex-col'>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className='text-lg'>{interview.personInterviewed}</CardTitle>
                <CardDescription>{t('interviews.interviewer')}: {interview.interviewer}</CardDescription>
              </div>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditForm(interview)}>{t('common.edit')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusToggle(interview)}>
                      {interview.status === 'pending' ? t('interviews.markCompleted') : t('interviews.markPending')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => openDeleteConfirmation(interview)} className="text-destructive">{t('common.delete')}</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm flex-grow">
            <div>
              <p className="font-semibold">{t('interviews.purpose')}</p>
              <p className="text-muted-foreground">{interview.purpose}</p>
            </div>
            <div>
              <p className="font-semibold">{t('common.date')}</p>
              <p className="text-muted-foreground">{format(interview.scheduledDate.toDate(), 'PPp')}</p>
            </div>
            <div>
              <p className="font-semibold">{t('common.status')}</p>
              <Badge variant={interview.status === 'completed' ? 'success' : 'destructive'} className=" mt-1">
                {t(`interviews.${interview.status}`)}
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
             <Button
                variant={isAdded ? "secondary" : "outline"}
                size="sm"
                asChild={!isAdded}
                disabled={isAdded}
                className='w-full'
                onClick={() => { if(!isAdded) handleAddToCalendar(interview.id)}}
              >
                {isAdded ? (
                  <>
                    <CheckCircle className="mr-2" />
                    {t('common.addedToCalendar')}
                  </>
                ) : (
                  <a href={createGoogleCalendarLink(interview)} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus className="mr-2" />
                    {t('common.addToCalendar')}
                  </a>
                )}
              </Button>
          </CardFooter>
        </Card>
      )})}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('interviews.title')}</h1>
          <p className="text-muted-foreground">{t('interviews.description')}</p>
        </div>
        <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('interviews.addInterview')}
        </Button>
      </div>

       <Dialog open={isFormOpen} onOpenChange={ (isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingInterview(null); } }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <InterviewForm onSubmit={handleFormSubmit} defaultValues={formDefaultValues} t={t} />
          </DialogContent>
        </Dialog>
        
      <DeleteConfirmationDialog 
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        interview={interviewToDelete}
        onConfirm={confirmDelete}
        addedToCalendar={addedToCalendar}
        t={t}
      />

      {loading ? (
         <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-40 w-full" />
         </div>
      ) : isMobile ? (
        renderMobileInterviews()
      ) : (
        <DataTable columns={tableColumns} data={interviews} t={t} />
      )}
    </div>
  );
}

    