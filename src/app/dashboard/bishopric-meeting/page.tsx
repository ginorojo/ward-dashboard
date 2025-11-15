'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { BishopricMeeting, BishopricMeetingNote } from '@/lib/types';
import { addDocument, addNoteToMeeting, deleteNoteFromMeeting, getCollection, getNotesForMeeting, updateNoteInMeeting } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import NoteForm from '@/components/dashboard/bishopric-meeting/note-form';
import NotesList from '@/components/dashboard/bishopric-meeting/notes-list';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { bishopricNoteSchema } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

type NoteFormValues = z.infer<typeof bishopricNoteSchema>;

export default function BishopricMeetingPage() {
  const { firestore, user } = useFirebase();
  const [meetings, setMeetings] = useState<BishopricMeeting[]>([]);
  const [notes, setNotes] = useState<BishopricMeetingNote[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<BishopricMeeting | null>(null);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BishopricMeetingNote | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchMeetings = async () => {
    if (!firestore) return;
    setLoadingMeetings(true);
    try {
      const meetingList = await getCollection<BishopricMeeting>(firestore, 'bishopricMeetings', { field: 'date', direction: 'desc' });
      setMeetings(meetingList);
      if (meetingList.length > 0 && !selectedMeeting) {
        setSelectedMeeting(meetingList[0]);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('bishopricMeeting.failedToFetchMeetings') });
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [firestore]);

  useEffect(() => {
    if (selectedMeeting && firestore) {
      setLoadingNotes(true);
      getNotesForMeeting(firestore, selectedMeeting.id)
        .then(setNotes)
        .catch(() => toast({ variant: 'destructive', title: t('common.error'), description: t('bishopricMeeting.failedToFetchNotes') }))
        .finally(() => setLoadingNotes(false));
    } else {
      setNotes([]);
    }
  }, [selectedMeeting, firestore]);

  const handleCreateMeeting = async () => {
      if (!user || !firestore) return;
      try {
          await addDocument(firestore, 'bishopricMeetings', { date: new Date() }, user.uid, 'bishopricMeeting');
          toast({ title: t('common.success'), description: t('bishopricMeeting.meetingCreated') });
          fetchMeetings();
      } catch (error) {
          toast({ variant: 'destructive', title: t('common.error'), description: t('bishopricMeeting.failedToCreateMeeting') });
      }
  };

  const handleNoteSubmit = async (data: NoteFormValues) => {
    if (!user || !firestore || !selectedMeeting) return;
    try {
      if (editingNote) {
        await updateNoteInMeeting(firestore, selectedMeeting.id, editingNote.id, data, user.uid);
        toast({ title: t('common.success'), description: t('bishopricMeeting.noteUpdated') });
      } else {
        await addNoteToMeeting(firestore, selectedMeeting.id, data, user.uid);
        toast({ title: t('common.success'), description: t('bishopricMeeting.noteAdded') });
      }
      setIsFormOpen(false);
      setEditingNote(null);
      const newNotes = await getNotesForMeeting(firestore, selectedMeeting.id);
      setNotes(newNotes);
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message || t('bishopricMeeting.failedToSaveNote') });
    }
  };

  const handleEditNote = (note: BishopricMeetingNote) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user || !firestore || !selectedMeeting) return;
    try {
      await deleteNoteFromMeeting(firestore, selectedMeeting.id, noteId, user.uid);
      toast({ title: t('common.success'), description: t('bishopricMeeting.noteDeleted') });
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to delete note.' });
    }
  };
  
  const dialogTitle = editingNote ? t('bishopricMeeting.editNote') : t('bishopricMeeting.createNewNote');
  const formDefaultValues = editingNote ? { ...editingNote, date: editingNote.date.toDate() } : { meetingId: selectedMeeting?.id || '' };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('bishopricMeeting.title')}</h1>
          <p className="text-muted-foreground">{t('bishopricMeeting.description')}</p>
        </div>
        <div className='flex gap-2'>
            <Button variant="outline" onClick={handleCreateMeeting}>{t('bishopricMeeting.createTodaysMeeting')}</Button>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingNote(null); }}>
                <DialogTrigger asChild>
                    <Button disabled={!selectedMeeting}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('bishopricMeeting.addNote')}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>
                    <NoteForm onSubmit={handleNoteSubmit} defaultValues={formDefaultValues} t={t} />
                </DialogContent>
            </Dialog>
        </div>
      </div>

        {loadingMeetings ? (
            <Skeleton className="h-96 w-full" />
        ) : meetings.length === 0 ? (
            <Card className="text-center py-16">
                <CardContent>
                    <h3 className="text-lg font-semibold">{t('bishopricMeeting.noMeetings')}</h3>
                    <p className="text-muted-foreground text-sm">{t('bishopricMeeting.noMeetingsDescription')}</p>
                </CardContent>
            </Card>
        ) : (
            <NotesList 
                meetings={meetings}
                notes={notes}
                selectedMeeting={selectedMeeting}
                onSelectMeeting={setSelectedMeeting}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                t={t}
            />
        )}
    </div>
  );
}
