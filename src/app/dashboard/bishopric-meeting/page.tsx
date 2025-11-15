'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { addDocument, getCollection, getNotesForMeeting, addNoteToMeeting, updateNoteInMeeting, deleteNoteFromMeeting } from '@/lib/firebase/firestore';
import type { BishopricMeeting, BishopricMeetingNote } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import NoteForm from '@/components/dashboard/bishopric-meeting/note-form';
import NotesList from '@/components/dashboard/bishopric-meeting/notes-list';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { bishopricNoteSchema } from '@/lib/schemas';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

type NoteFormValues = z.infer<typeof bishopricNoteSchema>;

export default function BishopricMeetingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [meetings, setMeetings] = useState<BishopricMeeting[]>([]);
  const [notes, setNotes] = useState<BishopricMeetingNote[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<BishopricMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BishopricMeetingNote | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const meetingsData = await getCollection<BishopricMeeting>('bishopricMeetings', { field: 'date', direction: 'desc' });
      setMeetings(meetingsData);
      if (meetingsData.length > 0) {
        setSelectedMeeting(meetingsData[0]);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch meetings.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    if (selectedMeeting) {
      const fetchNotes = async () => {
        setLoading(true);
        try {
          const notesData = await getNotesForMeeting(selectedMeeting.id);
          setNotes(notesData);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch notes.' });
        } finally {
          setLoading(false);
        }
      };
      fetchNotes();
    } else {
        setNotes([]);
    }
  }, [selectedMeeting, toast]);

  const handleCreateMeeting = async () => {
    if (!user) return;
    try {
      const newMeetingId = await addDocument('bishopricMeetings', { date: Timestamp.now() }, user.uid, 'bishopricMeeting');
      toast({ title: 'Success', description: 'New meeting created.' });
      fetchMeetings();
      // Optionally select the new meeting
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to create new meeting.' });
    }
  };

  const handleFormSubmit = async (data: NoteFormValues) => {
    if (!user || !selectedMeeting) return;
    
    const noteData = {
      ...data,
      date: Timestamp.fromDate(data.date),
    };

    try {
      if (editingNote) {
        await updateNoteInMeeting(selectedMeeting.id, editingNote.id, noteData, user.uid);
        toast({ title: 'Success', description: 'Note updated successfully.' });
      } else {
        await addNoteToMeeting(selectedMeeting.id, noteData, user.uid);
        toast({ title: 'Success', description: 'Note added successfully.' });
      }
      setIsFormOpen(false);
      setEditingNote(null);
      const notesData = await getNotesForMeeting(selectedMeeting.id);
      setNotes(notesData);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save note.' });
    }
  };
  
  const openEditForm = (note: BishopricMeetingNote) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };
  
  const openNewForm = () => {
    if (!selectedMeeting) {
      toast({ variant: 'destructive', title: 'No Meeting Selected', description: 'Please create or select a meeting first.' });
      return;
    }
    setEditingNote(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (noteId: string) => {
    if (!user || !selectedMeeting) return;
    try {
      await deleteNoteFromMeeting(selectedMeeting.id, noteId, user.uid);
      toast({ title: 'Success', description: 'Note deleted successfully.' });
      const notesData = await getNotesForMeeting(selectedMeeting.id);
      setNotes(notesData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete note.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Bishopric Meeting Notes</h1>
          <p className="text-muted-foreground">Record and review notes from bishopric meetings.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreateMeeting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} onOpenChangeCapture={() => !isFormOpen && setEditingNote(null)}>
              <DialogTrigger asChild>
                <Button onClick={openNewForm}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
                </DialogHeader>
                <NoteForm
                  onSubmit={handleFormSubmit}
                  defaultValues={editingNote ? { ...editingNote, date: editingNote.date.toDate() } : { meetingId: selectedMeeting?.id || "" }}
                />
              </DialogContent>
            </Dialog>
        </div>
      </div>
        
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <NotesList 
            meetings={meetings}
            notes={notes}
            selectedMeeting={selectedMeeting}
            onSelectMeeting={setSelectedMeeting}
            onEditNote={openEditForm}
            onDeleteNote={handleDelete}
        />
      )}
    </div>
  );
}
