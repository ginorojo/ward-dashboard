
'use client';
import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { MeetingNote } from '@/lib/types';
import { getMeetingNotes, saveMeetingNote, deleteMeetingNote } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import NoteForm from '@/components/dashboard/bishopric-meeting/note-form';
import NotesList from '@/components/dashboard/bishopric-meeting/notes-list';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { meetingNoteSchema } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ensureDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

type NoteFormValues = z.infer<typeof meetingNoteSchema>;

export default function MeetingNotesPage() {
  const { firestore, user } = useFirebase();
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<MeetingNote | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const fetchNotes = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const notesList = await getMeetingNotes(firestore);
      setNotes(notesList);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('bishopricMeeting.failedToFetchNotes') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [firestore]);

  const handleNoteSubmit = async (data: NoteFormValues) => {
    if (!user || !firestore) return;
    try {
      await saveMeetingNote(firestore, data, user.uid, editingNote?.id);
      toast({ title: t('common.success'), description: editingNote ? t('bishopricMeeting.noteUpdated') : t('bishopricMeeting.noteAdded') });
      fetchNotes();
      setIsFormOpen(false);
      setEditingNote(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('bishopricMeeting.failedToSaveNote') });
    }
  };

  const handleEditNote = (note: MeetingNote) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteMeetingNote(firestore, noteId, user.uid);
      toast({ title: t('common.success'), description: t('bishopricMeeting.noteDeleted') });
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to delete note.' });
    }
  };

  const getNoteTypeLabel = (note: MeetingNote) => {
    if (note.type === 'other') return note.otherType || t('bishopricMeeting.type_other');
    return t(`bishopricMeeting.type_${note.type}`);
  };

  const renderMobileNotes = () => (
    <div className="space-y-4">
      {notes.map(note => (
        <Card key={note.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-semibold">{format(ensureDate(note.date), 'PPP')}</p>
                  <Badge variant="outline" className="text-[10px]">{getNoteTypeLabel(note)}</Badge>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap break-words">{note.content}</p>
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
        <Button onClick={() => { setEditingNote(null); setIsFormOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('bishopricMeeting.addNote')}
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingNote(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNote ? t('bishopricMeeting.editNote') : t('bishopricMeeting.createNewNote')}</DialogTitle>
              <DialogDescription className="sr-only">Form to create or edit a meeting note.</DialogDescription>
            </DialogHeader>
            <NoteForm 
              onSubmit={handleNoteSubmit} 
              defaultValues={editingNote ? { 
                ...editingNote, 
                date: ensureDate(editingNote.date) 
              } : undefined} 
              t={t} 
            />
          </DialogContent>
      </Dialog>

      {loading ? (
          <Skeleton className="h-96 w-full" />
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
    </div>
  );
}
