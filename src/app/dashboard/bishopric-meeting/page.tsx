'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { BishopricMeeting, BishopricMeetingNote } from '@/lib/types';
import { addNoteToMeeting, deleteNoteFromMeeting, getCollection, getNotesForMeeting, updateNoteInMeeting } from '@/lib/firebase/firestore';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type NoteFormValues = z.infer<typeof bishopricNoteSchema>;

export default function BishopricMeetingPage() {
  const { firestore, user } = useFirebase();
  const [meetings, setMeetings] = useState<BishopricMeeting[]>([]);
  const [notes, setNotes] = useState<BishopricMeetingNote[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BishopricMeetingNote | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!firestore) return;
    setLoadingMeetings(true);
    getCollection<BishopricMeeting>(firestore, 'bishopricMeetings', { field: 'date', direction: 'desc' })
      .then(meetingList => {
        setMeetings(meetingList);
        if (meetingList.length > 0 && !selectedMeetingId) {
          setSelectedMeetingId(meetingList[0].id);
        }
      })
      .catch(() => toast({ variant: 'destructive', title: t('common.error'), description: t('bishopricMeeting.failedToFetchMeetings') }))
      .finally(() => setLoadingMeetings(false));
  }, [firestore]);

  useEffect(() => {
    if (selectedMeetingId && firestore) {
      setLoadingNotes(true);
      getNotesForMeeting(firestore, selectedMeetingId)
        .then(setNotes)
        .catch(() => toast({ variant: 'destructive', title: t('common.error'), description: t('bishopricMeeting.failedToFetchNotes') }))
        .finally(() => setLoadingNotes(false));
    } else {
      setNotes([]);
    }
  }, [selectedMeetingId, firestore]);

  const selectedMeeting = useMemo(() => {
    return meetings.find(m => m.id === selectedMeetingId) || null;
  }, [meetings, selectedMeetingId]);

  const handleNoteSubmit = async (data: NoteFormValues) => {
    if (!user || !firestore || !selectedMeetingId) return;
    try {
      if (editingNote) {
        updateNoteInMeeting(firestore, selectedMeetingId, editingNote.id, data, user.uid);
        toast({ title: t('common.success'), description: t('bishopricMeeting.noteUpdated') });
      } else {
        await addNoteToMeeting(firestore, selectedMeetingId, data, user.uid);
        toast({ title: t('common.success'), description: t('bishopricMeeting.noteAdded') });
      }
      setIsFormOpen(false);
      setEditingNote(null);
      const newNotes = await getNotesForMeeting(firestore, selectedMeetingId);
      setNotes(newNotes);
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('bishopricMeeting.failedToSaveNote') });
    }
  };

  const handleEditNote = (note: BishopricMeetingNote) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!user || !firestore || !selectedMeetingId) return;
    deleteNoteFromMeeting(firestore, selectedMeetingId, noteId, user.uid);
    toast({ title: t('common.success'), description: t('bishopricMeeting.noteDeleted') });
    setNotes(notes.filter(n => n.id !== noteId));
  };
  
  const handleSelectChange = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
  };
  
  const dialogTitle = editingNote ? t('bishopricMeeting.editNote') : t('bishopricMeeting.createNewNote');
  const formDefaultValues = editingNote ? { ...editingNote, date: editingNote.date.toDate() } : { meetingId: selectedMeetingId || '', date: new Date() };

  const renderMobileNotes = () => (
    <div className="space-y-4">
      {notes.map(note => (
        <Card key={note.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold">{format(note.date.toDate(), 'PPP')}</p>
                <p className="mt-2 text-muted-foreground whitespace-pre-wrap break-words">{note.content}</p>
              </div>
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditNote(note)}>{t('common.edit')}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive">{t('common.delete')}</DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('common.delete')} Note?</AlertDialogTitle>
                    <AlertDialogDescription>{t('bishopricMeeting.deleteNoteConfirm')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">{t('common.delete')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('bishopricMeeting.title')}</h1>
          <p className="text-muted-foreground">{t('bishopricMeeting.description')}</p>
        </div>
        <div className='flex gap-1'>
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
          <>
            <div className="flex justify-end">
              <Select onValueChange={handleSelectChange} value={selectedMeetingId || ''}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue placeholder={t('bishopricMeeting.selectAMeeting')} />
                  </SelectTrigger>
                  <SelectContent>
                      {meetings.map(meeting => (
                          <SelectItem key={meeting.id} value={meeting.id}>
                              {format(meeting.date.toDate(), 'PPP')}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>

            {loadingNotes ? (
              <Skeleton className="h-64 w-full" />
            ) : notes.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                    <h3 className="text-lg font-semibold">{t('bishopricMeeting.noNotes')}</h3>
                    <p className="text-muted-foreground text-sm">{t('bishopricMeeting.noNotesDescription')}</p>
                </CardContent>
              </Card>
            ) : isMobile ? (
              renderMobileNotes()
            ) : (
              <NotesList 
                  notes={notes}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  t={t}
              />
            )}
          </>
        )}
    </div>
  );
}
