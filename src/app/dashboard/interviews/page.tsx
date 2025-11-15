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

type InterviewFormValues = z.infer<typeof interviewSchema>;

export default function InterviewsPage() {
  const { firestore, user } = useFirebase();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const { toast } = useToast();

  const fetchInterviews = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const interviewList = await getCollection<Interview>(firestore, 'interviews', { field: 'scheduledDate', direction: 'desc' });
      setInterviews(interviewList);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch interviews.' });
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
        toast({ title: 'Success', description: 'Interview updated successfully.' });
      } else {
        await addDocument(firestore, 'interviews', data, user.uid, 'interview');
        toast({ title: 'Success', description: 'Interview created successfully.' });
      }
      setIsFormOpen(false);
      setEditingInterview(null);
      fetchInterviews();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save interview.' });
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
      toast({ title: 'Success', description: 'Interview deleted successfully.' });
      fetchInterviews();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete interview.' });
    }
  };
  
  const handleStatusToggle = async (interview: Interview) => {
      if (!user || !firestore) return;
      const newStatus = interview.status === 'pending' ? 'completed' : 'pending';
      try {
          await updateDocument(firestore, 'interviews', interview.id, { status: newStatus }, user.uid, 'interview');
          toast({ title: 'Success', description: 'Interview status updated.'});
          fetchInterviews();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
      }
  };

  const tableColumns = useMemo(() => columns({ openEditForm, handleDelete, handleStatusToggle }), [interviews]);

  const dialogTitle = editingInterview ? 'Edit Interview' : 'Create New Interview';
  const formDefaultValues = editingInterview ? {
    ...editingInterview,
    scheduledDate: editingInterview.scheduledDate.toDate(),
  } : undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Interviews</h1>
          <p className="text-muted-foreground">Schedule and manage ward interviews.</p>
        </div>
        <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Interview
        </Button>
      </div>

       <Dialog open={isFormOpen} onOpenChange={ (isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingInterview(null); } }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <InterviewForm onSubmit={handleFormSubmit} defaultValues={formDefaultValues} />
          </DialogContent>
        </Dialog>

      {loading ? (
         <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-40 w-full" />
         </div>
      ) : (
        <DataTable columns={tableColumns} data={interviews} />
      )}
    </div>
  );
}
