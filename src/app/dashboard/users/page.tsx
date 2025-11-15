'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { getCollection, updateUserProfile, logAction, addDocument, deleteUser } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { DataTable } from '@/components/dashboard/users/data-table';
import { columns } from '@/components/dashboard/users/columns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UserForm from '@/components/dashboard/users/user-form';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { userSchema } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { firestore } = useFirebase();
  const { user: authUser } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const usersList = await getCollection<UserProfile>(firestore, 'users', { field: 'createdAt', direction: 'desc' });
      setUsers(usersList);
      if (authUser) {
        const currentUserProfile = usersList.find(u => u.uid === authUser.uid);
        setCurrentUser(currentUserProfile || null);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('users.fetchFailed') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [firestore, authUser]);

  const handleCreateUser = async (data: UserFormValues) => {
    if (!authUser || !firestore) return;
    try {
      await addDocument(firestore, 'users', {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: true,
      }, authUser.uid, 'user');
      
      toast({ title: t('common.success'), description: t('users.userCreated') });
      setIsFormOpen(false);
      fetchUsers();
    } catch (error: any) {
      // The contextual error is already emitted by addDocument
      // We can still show a generic toast if we want
      toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to create user.' });
    }
  };
  
  const handleUpdateUser = (data: UserFormValues) => {
    if(!authUser || !firestore || !editingUser) return;
    updateUserProfile(firestore, editingUser.uid, {name: data.name, email: data.email, role: data.role});
    logAction(firestore, authUser.uid, 'update', 'user', editingUser.uid, `Updated user profile`);
    toast({ title: t('common.success'), description: t('users.userUpdated') });
    setIsFormOpen(false);
    setEditingUser(null);
    fetchUsers();
  }

  const handleStatusToggle = (user: UserProfile) => {
    if (!authUser || !firestore) return;
    updateUserProfile(firestore, user.uid, { isActive: !user.isActive });
    logAction(firestore, authUser.uid, 'update', 'user', user.uid, `Set status to ${!user.isActive ? 'active' : 'inactive'}`);
    toast({ title: t('common.success'), description: t('users.userStatusUpdated') });
    fetchUsers();
  };

  const handleDeleteUser = (uid: string) => {
    if (!authUser || !firestore) return;
    deleteUser(firestore, uid);
    logAction(firestore, authUser.uid, 'delete', 'user', uid, `Deleted user`);
    toast({ title: t('common.success'), description: t('users.userDeleted') });
    fetchUsers();
  }
  
  const openEditForm = (user: UserProfile) => {
    setEditingUser(user);
    setIsFormOpen(true);
  }
  
  const openNewForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const tableColumns = useMemo(() => columns({ fetchUsers, currentUser, t, deleteUser: handleDeleteUser }), [fetchUsers, currentUser, t]);
  
  const dialogTitle = editingUser ? t('users.editUser') : t('users.createNewUser');
  const formSubmitHandler = editingUser ? handleUpdateUser : handleCreateUser;
  
  const formDefaultValues = editingUser ? {
    name: editingUser.name,
    email: editingUser.email,
    role: editingUser.role,
  } : undefined;

  const renderMobileUsers = () => (
    <div className="space-y-4">
      {users.map(user => {
        const isCurrentUser = currentUser?.uid === user.uid;
        return (
          <Card key={user.uid}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className='text-lg'>{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <AlertDialog>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditForm(user)}>{t('common.edit')}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusToggle(user)} disabled={isCurrentUser}>
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
                      <AlertDialogAction onClick={() => handleDeleteUser(user.uid)} className="bg-destructive hover:bg-destructive/90">
                          {t('users.continue')}
                      </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{t('common.role')}</p>
                  <Badge variant="secondary" className="capitalize mt-1">{t(`users.role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`)}</Badge>
                </div>
                <div>
                  <p className="font-semibold">{t('common.status')}</p>
                   <Badge variant={user.isActive ? 'default' : 'destructive'} className="mt-1">
                      {user.isActive ? t('users.active') : t('users.inactive')}
                    </Badge>
                </div>
              </div>
              <div>
                <p className="font-semibold">{t('users.createdAt')}</p>
                <p className="text-muted-foreground">{user.createdAt ? format((user.createdAt as any).toDate(), 'PP') : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.description')}</p>
        </div>
        <Button onClick={openNewForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('users.addUser')}
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingUser(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={formSubmitHandler} defaultValues={formDefaultValues} isEditMode={!!editingUser} t={t} />
          </DialogContent>
        </Dialog>

      {loading ? (
         <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-40 w-full" />
         </div>
      ) : isMobile ? (
        renderMobileUsers()
      ) : (
        <DataTable columns={tableColumns} data={users} t={t}/>
      )}
    </div>
  );
}
