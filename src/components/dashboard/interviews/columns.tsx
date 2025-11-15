'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Interview } from '@/lib/types';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type ColumnsProps = {
  openEditForm: (interview: Interview) => void;
  handleDelete: (id: string) => void;
  handleStatusToggle: (interview: Interview) => void;
};

export const columns = ({ openEditForm, handleDelete, handleStatusToggle }: ColumnsProps): ColumnDef<Interview>[] => [
  {
    accessorKey: 'personInterviewed',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Person
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('personInterviewed')}</div>,
  },
  {
    accessorKey: 'interviewer',
    header: 'Interviewer',
  },
  {
    accessorKey: 'purpose',
    header: 'Purpose',
  },
  {
    accessorKey: 'scheduledDate',
    header: 'Date',
    cell: ({ row }) => {
      const date = (row.getValue('scheduledDate') as any)?.toDate();
      return date ? format(date, 'PPp') : 'N/A';
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: "pending" | "completed" = row.getValue('status');
      return (
        <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const interview = row.original;

      return (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openEditForm(interview)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusToggle(interview)}>
                Mark as {interview.status === 'pending' ? 'Completed' : 'Pending'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete this interview record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(interview.id)} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
