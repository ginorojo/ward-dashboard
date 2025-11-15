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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { updateUserProfile, logAction, deleteUser } from '@/lib/firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UserForm from './user-form';
import { userSchema } from '@/lib/schemas';
import { z } from 'zod';
import { useFirestore } from '@/firebase';

type UserFormValues = z.infer<typeof userSchema>;

type ColumnsProps = {
  fetchUsers: () => void;
  currentUser: UserProfile | null;
  t: (key: string) => string;
  deleteUser: (uid: string) => void;
}

export const columns = ({ fetchUsers, currentUser, t, deleteUser: handleDeleteUser }: ColumnsProps): ColumnDef<UserProfile>[] => [
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
    cell: ({ row }) => <Badge variant="secondary" className="capitalize">{row.getValue('role')}</Badge>,
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
      const { toast } = useToast();
      const { user: authUser } = useUser();
      const firestore = useFirestore();
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

      const handleStatusToggle = () => {
        if (!authUser || !firestore) return;
        updateUserProfile(firestore, user.uid, { isActive: !user.isActive });
        logAction(firestore, authUser.uid, 'update', 'user', user.uid, `Set status to ${!user.isActive ? 'active' : 'inactive'}`);
        toast({ title: t('common.success'), description: t('users.userStatusUpdated') });
        fetchUsers();
      };
      
      const handleUpdateUser = (data: UserFormValues) => {
        if(!authUser || !firestore) return;
        updateUserProfile(firestore, user.uid, {name: data.name, email: data.email, role: data.role});
        logAction(firestore, authUser.uid, 'update', 'user', user.uid, `Updated user profile`);
        toast({ title: t('common.success'), description: t('users.userUpdated') });
        setIsEditDialogOpen(false);
        fetchUsers();
      }

      const isCurrentUser = currentUser?.uid === user.uid;

      return (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                <DialogTrigger asChild>
                    <DropdownMenuItem>{t('common.edit')}</DropdownMenuItem>
                </DialogTrigger>
                <DropdownMenuItem onClick={handleStatusToggle} disabled={isCurrentUser}>
                  {user.isActive ? t('users.deactivate') : t('users.activate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" disabled={isCurrentUser}>{t('users.deleteUser')}</DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('interviews.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('users.deleteUserConfirm')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={() => handleDeleteUser(user.uid)}
                >
                  {t('users.continue')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('users.editUser')}</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={handleUpdateUser} defaultValues={user} isEditMode={true} t={t} />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
