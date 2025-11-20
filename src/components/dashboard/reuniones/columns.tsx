'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Reunion } from '@/lib/types';
import { MoreHorizontal, ArrowUpDown, CalendarPlus, CheckCircle } from 'lucide-react';
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

type ColumnsProps = {
  openEditForm: (reunion: Reunion) => void;
  handleDelete: (reunion: Reunion) => void;
  createGoogleCalendarLink: (reunion: Reunion) => string;
  t: (key: string) => string;
  addedToCalendar: string[];
  onAddToCalendar: (reunionId: string) => void;
};

export const columns = ({ openEditForm, handleDelete, createGoogleCalendarLink, t, addedToCalendar, onAddToCalendar }: ColumnsProps): ColumnDef<Reunion>[] => [
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
      const isAdded = addedToCalendar.includes(reunion.id);

      return (
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
            <DropdownMenuItem
              disabled={isAdded}
              onSelect={(e) => {
                if (!isAdded) {
                  e.preventDefault();
                  onAddToCalendar(reunion.id);
                  window.open(createGoogleCalendarLink(reunion), '_blank');
                }
              }}
            >
              {isAdded ? (
                  <>
                      <CheckCircle className="mr-2" />
                      {t('common.addedToCalendar')}
                  </>
              ) : (
                  <>
                      <CalendarPlus className="mr-2" />
                      {t('common.addToCalendar')}
                  </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleDelete(reunion)} className="text-destructive">
                {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
