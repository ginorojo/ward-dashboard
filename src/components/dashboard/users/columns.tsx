'use client';
import { ColumnDef } from '@tanstack/react-table';
import { UserProfile } from '@/lib/types';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

type ColumnsProps = {
  openEditForm: (user: UserProfile) => void;
  handleDelete: (uid: string) => void;
  handleStatusToggle: (user: UserProfile) => void;
  currentUser: UserProfile | null;
  t: (key: string) => string;
  handlePasswordReset: (email: string) => void;
}

export const columns = ({
  openEditForm,
  handleDelete,
  handleStatusToggle,
  currentUser,
  t,
  handlePasswordReset,
}: ColumnsProps): ColumnDef<UserProfile>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('common.name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'email',
    header: t('common.email'),
  },
  {
    accessorKey: 'role',
    header: t('common.role'),
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize">
        {t(
          `users.role${
            (row.getValue('role') as string).charAt(0).toUpperCase() +
            (row.getValue('role') as string).slice(1)
          }`
        )}
      </Badge>
    ),
  },
  {
    accessorKey: 'isActive',
    header: t('common.status'),
    cell: ({ row }) => (
      <Badge variant={row.getValue('isActive') ? 'default' : 'destructive'}>
        {row.getValue('isActive') ? t('users.active') : t('users.inactive')}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: t('users.createdAt'),
    cell: ({ row }) => {
      const date = (row.getValue('createdAt') as any)?.toDate();
      return date ? format(date, 'PP') : 'N/A';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;
      const isCurrentUser = currentUser?.uid === user.uid;
      const isAdministrator = currentUser?.role === 'administrator';

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
              <DropdownMenuItem onClick={() => openEditForm(user)}>
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusToggle(user)}
                disabled={isCurrentUser}
              >
                {user.isActive ? t('users.deactivate') : t('users.activate')}
              </DropdownMenuItem>
              {isAdministrator && !isCurrentUser && (
                <DropdownMenuItem onClick={() => handlePasswordReset(user.email)}>
                  {t('users.resetPassword')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-destructive"
                  disabled={isCurrentUser}
                >
                  {t('users.deleteUser')}
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('users.deleteUser')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('users.deleteUserConfirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => handleDelete(user.uid)}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
