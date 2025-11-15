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
import { useAuth } from '@/hooks/use-auth';
import { updateUserProfile, logAction } from '@/lib/firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UserForm from './user-form';
import { userSchema } from '@/lib/schemas';
import { z } from 'zod';

type UserFormValues = z.infer<typeof userSchema>;

type ColumnsProps = {
  fetchUsers: () => void;
  currentUser: UserProfile | null;
}

export const columns = ({ fetchUsers, currentUser }: ColumnsProps): ColumnDef<UserProfile>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="secondary" className="capitalize">{row.getValue('role')}</Badge>,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.getValue('isActive') ? 'default' : 'destructive'}>
        {row.getValue('isActive') ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
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
      const { user: authUser } = useAuth();
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

      const handleStatusToggle = async () => {
        if (!authUser) return;
        try {
          await updateUserProfile(user.uid, { isActive: !user.isActive });
          await logAction(authUser.uid, 'update', 'user', user.uid, `Set status to ${!user.isActive ? 'active' : 'inactive'}`);
          toast({ title: 'Success', description: 'User status updated.' });
          fetchUsers();
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user status.' });
        }
      };
      
      const handleUpdateUser = async (data: UserFormValues) => {
        if(!authUser) return;
        try {
            await updateUserProfile(user.uid, {name: data.name, email: data.email, role: data.role});
            await logAction(authUser.uid, 'update', 'user', user.uid, `Updated user profile`);
            toast({ title: 'Success', description: 'User updated successfully.' });
            setIsEditDialogOpen(false);
            fetchUsers();
        } catch(error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update user.' });
        }
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
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DialogTrigger asChild>
                    <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                </DialogTrigger>
                <DropdownMenuItem onClick={handleStatusToggle} disabled={isCurrentUser}>
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" disabled={isCurrentUser}>Delete User</DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently deactivate the user's account and remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={() => { /* Implement permanent deletion if needed, e.g., via a Cloud Function */ }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={handleUpdateUser} defaultValues={user} isEditMode={true} />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
