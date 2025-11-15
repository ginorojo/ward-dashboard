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
  t: (key: string) => string;
};

export const columns = ({ openEditForm, handleDelete, handleStatusToggle, t }: ColumnsProps): ColumnDef<Interview>[] => [
  {
    accessorKey: 'personInterviewed',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        {t('interviews.person')}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('personInterviewed')}</div>,
  },
  {
    accessorKey: 'interviewer',
    header: t('interviews.interviewer'),
  },
  {
    accessorKey: 'purpose',
    header: t('interviews.purpose'),
    cell: ({ row }) => <div className="whitespace-normal max-w-xs">{row.getValue('purpose')}</div>
  },
  {
    accessorKey: 'scheduledDate',
    header: t('common.date'),
    cell: ({ row }) => {
      const date = (row.getValue('scheduledDate') as any)?.toDate();
      return date ? format(date, 'PPp') : 'N/A';
    },
  },
  {
    accessorKey: 'status',
    header: t('common.status'),
    cell: ({ row }) => {
      const status: "pending" | "completed" = row.getValue('status');
      return (
        <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="capitalize">
          {t(`interviews.${status}`)}
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
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
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
      );
    },
  },
];
