'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCollection, addDocument, updateDocument, deleteDocument, logAction } from '@/lib/firebase/firestore';
import type { Interview } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from './data-table';
import { columns as createColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InterviewForm from '@/components/dashboard/interviews/interview-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { interviewSchema } from '@/lib/schemas';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

type InterviewFormValues = z.infer<typeof interviewSchema>;

export default function InterviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const interviewsData = await getCollection<Interview>('interviews', { field: 'scheduledDate', direction: 'desc' });
      setInterviews(interviewsData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch interviews.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleFormSubmit = async (data: InterviewFormValues) => {
    if (!user) return;
    
    const interviewData = {
      ...data,
      scheduledDate: Timestamp.fromDate(data.scheduledDate),
    };

    try {
      if (editingInterview) {
        await updateDocument('interviews', editingInterview.id, interviewData, user.uid, 'interview');
        toast({ title: 'Success', description: 'Interview updated successfully.' });
      } else {
        await addDocument('interviews', interviewData, user.uid, 'interview');
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
  };
  
  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDocument('interviews', id, user.uid, 'interview');
      toast({ title: 'Success', description: 'Interview deleted successfully.' });
      fetchInterviews();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete interview.' });
    }
  };
  
  const handleStatusToggle = async (interview: Interview) => {
    if (!user) return;
    try {
        const newStatus = interview.status === 'pending' ? 'completed' : 'pending';
        await updateDocument('interviews', interview.id, { status: newStatus }, user.uid, 'interview');
        toast({title: 'Success', description: 'Interview status updated.'});
        fetchInterviews();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  }

  const columns = createColumns({ openEditForm, handleDelete, handleStatusToggle });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Interviews</h1>
          <p className="text-muted-foreground">Schedule and manage ward interviews.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} onOpenChangeCapture={() => !isFormOpen && setEditingInterview(null)}>
          <DialogTrigger asChild>
            <Button onClick={openNewForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Interview
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingInterview ? 'Edit Interview' : 'Create New Interview'}</DialogTitle>
            </DialogHeader>
            <InterviewForm 
              onSubmit={handleFormSubmit}
              defaultValues={editingInterview ? {
                ...editingInterview,
                scheduledDate: editingInterview.scheduledDate.toDate(),
              } : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Interviews</CardTitle>
          <CardDescription>A list of all upcoming and completed interviews.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable columns={columns} data={interviews} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
