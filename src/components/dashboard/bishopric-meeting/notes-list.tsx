'use client';
import { BishopricMeetingNote } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface NotesListProps {
  notes: BishopricMeetingNote[];
  onEditNote: (note: BishopricMeetingNote) => void;
  onDeleteNote: (noteId: string) => void;
  t: (key: string) => string;
}

export default function NotesList({ notes, onEditNote, onDeleteNote, t }: NotesListProps) {

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-0">
          {notes.map((note, index) => (
            <div key={note.id} className={`p-4 ${index < notes.length - 1 ? 'border-b' : ''}`}>
              <div className="flex justify-between items-start gap-4">
                <div className='flex-1'>
                  <p className="text-sm text-muted-foreground">{format(note.date.toDate(), 'PPP')}</p>
                  <p className="mt-2 whitespace-pre-wrap">{note.content}</p>
                </div>
                 <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditNote(note)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>{t('common.delete')} Note?</AlertDialogTitle>
                              <AlertDialogDescription>
                              {t('bishopricMeeting.deleteNoteConfirm')}
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">
                                  {t('common.delete')}
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                 </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
