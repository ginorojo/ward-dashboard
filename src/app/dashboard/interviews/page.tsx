'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { Interview } from '@/lib/types';
import { addDocument, deleteDocument, getCollection, updateDocument } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DataTable } from '@/components/dashboard/interviews/data-table';
import { columns } from '@/components/dashboard/interviews/columns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InterviewForm from '@/components/dashboard/interviews/interview-form';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { interviewSchema } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type InterviewFormValues = z.infer<typeof interviewSchema>;

export default function InterviewsPage() {
  const { firestore, user } = useFirebase();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

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
      toast({ variant: 'destructive', title: t('common.error'), description: error.message || 'Failed to save interview.' });
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

  const handleDelete = async (id: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDocument(firestore, 'interviews', id, user.uid, 'interview');
      toast({ title: t('common.success'), description: t('interviews.interviewDeleted') });
      fetchInterviews();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to delete interview.' });
    }
  };
  
  const handleStatusToggle = async (interview: Interview) => {
      if (!user || !firestore) return;
      const newStatus = interview.status === 'pending' ? 'completed' : 'pending';
      try {
          await updateDocument(firestore, 'interviews', interview.id, { status: newStatus }, user.uid, 'interview');
          toast({ title: t('common.success'), description: t('interviews.statusUpdated')});
          fetchInterviews();
      } catch (error) {
          toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to update status.' });
      }
  };

  const tableColumns = useMemo(() => columns({ openEditForm, handleDelete, handleStatusToggle, t }), [interviews, t]);

  const dialogTitle = editingInterview ? t('interviews.editInterview') : t('interviews.createNewInterview');
  const formDefaultValues = editingInterview ? {
    ...editingInterview,
    scheduledDate: editingInterview.scheduledDate.toDate(),
  } : undefined;

  const renderMobileInterviews = () => (
    <div className="space-y-4">
      {interviews.map(interview => (
        <Card key={interview.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className='text-lg'>{interview.personInterviewed}</CardTitle>
                <CardDescription>{t('interviews.interviewer')}: {interview.interviewer}</CardDescription>
              </div>
               <AlertDialog>
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
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive">{t('common.delete')}</DropdownMenuItem>
                    </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('interviews.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('interviews.deleteConfirmDescription')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(interview.id)} className="bg-destructive hover:bg-destructive/90">
                        {t('common.delete')}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
              <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'} className="capitalize mt-1">
                {t(`interviews.${interview.status}`)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
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
