'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Reunion } from '@/lib/types';
import { MoreHorizontal, ArrowUpDown, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type ColumnsProps = {
  openEditForm: (reunion: Reunion) => void;
  handleDelete: (id: string) => void;
  createGoogleCalendarLink: (reunion: Reunion) => string;
  t: (key: string) => string;
};

export const columns = ({ openEditForm, handleDelete, createGoogleCalendarLink, t }: ColumnsProps): ColumnDef<Reunion>[] => [
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        {t('common.date')}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = (row.getValue('scheduledAt') as any)?.toDate();
      return date ? <div className="font-medium">{format(date, 'PPp')}</div> : 'N/A';
    },
  },
  {
    accessorKey: 'reason',
    header: t('reuniones.reason'),
    cell: ({ row }) => <div className="whitespace-normal max-w-xs">{row.getValue('reason')}</div>
  },
  {
    accessorKey: 'participants',
    header: t('reuniones.participants'),
    cell: ({ row }) => {
        const participants = row.getValue('participants') as string[];
        return <div className="whitespace-normal max-w-xs">{participants.join(', ')}</div>
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const reunion = row.original;

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
              <DropdownMenuItem onClick={() => openEditForm(reunion)}>{t('common.edit')}</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={createGoogleCalendarLink(reunion)} target="_blank" rel="noopener noreferrer">
                  <CalendarPlus className="mr-2" />
                  {t('common.addToCalendar')}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive">{t('common.delete')}</DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('reuniones.deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('reuniones.deleteConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(reunion.id)} className="bg-destructive hover:bg-destructive/90">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
