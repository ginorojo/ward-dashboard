'use client';
import { BishopricMeeting, BishopricMeetingNote } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface NotesListProps {
  meetings: BishopricMeeting[];
  notes: BishopricMeetingNote[];
  selectedMeeting: BishopricMeeting | null;
  onSelectMeeting: (meeting: BishopricMeeting) => void;
  onEditNote: (note: BishopricMeetingNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function NotesList({ meetings, notes, selectedMeeting, onSelectMeeting, onEditNote, onDeleteNote }: NotesListProps) {
  const handleSelectChange = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      onSelectMeeting(meeting);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>Meeting Notes</CardTitle>
                <CardDescription>Notes for the selected meeting.</CardDescription>
            </div>
            <div className="mt-4 sm:mt-0">
                <Select onValueChange={handleSelectChange} value={selectedMeeting?.id}>
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a meeting" />
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
        </div>
      </CardHeader>
      <CardContent>
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="rounded-lg border bg-card text-card-foreground p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">{format(note.date.toDate(), 'PPP')}</p>
                    <p className="mt-2 whitespace-pre-wrap">{note.content}</p>
                  </div>
                   <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditNote(note)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the note.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                   </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <p>No notes for this meeting.</p>
            <p className="text-sm">Create a new note to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
