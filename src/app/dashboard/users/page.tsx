'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { getCollection, updateUserProfile, logAction, deleteUser as deleteUserFromDb } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { DataTable } from '@/components/dashboard/users/data-table';
import { columns } from '@/components/dashboard/users/columns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UserForm from '@/components/dashboard/users/user-form';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { userSchema, createUserSchema } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

type UserFormValues = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const { firestore, auth } = useFirebase();
  const { user: authUser } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
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
      toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to fetch users.' });
    } finally {
      setLoading(false);
    }
  }, [firestore, authUser, toast, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (data: UserFormValues) => {
    if (!authUser || !firestore || !auth) return;
    
    // Stash the current user's UID before the auth state changes.
    const creatorUid = authUser.uid;

    try {
      // This will sign in the new user automatically, which is a known Firebase behavior.
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password!);
      const newUid = userCredential.user.uid;
      
      const userDocRef = doc(firestore, 'users', newUid);
      const userDocData = {
        uid: newUid,
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: true,
        createdBy: creatorUid,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, userDocData);

      // Log the action using the stashed UID.
      await logAction(firestore, creatorUid, 'create', 'user', newUid, `Created user with role ${data.role}`);
      
      toast({ 
        title: t('common.success'), 
        description: "User created. Please log in again to continue managing users.",
        duration: 5000,
      });
      
      setIsFormOpen(false);
      fetchUsers(); // Refresh the list

    } catch (error: any) {
        let errorMessage = 'Failed to create user.';
        if (error.code && error.code.startsWith('auth/')) {
            errorMessage = error.message;
        } else {
            const permissionError = new FirestorePermissionError({
                path: `users`,
                operation: 'create',
                requestResourceData: { email: data.email, role: data.role },
            });
            errorEmitter.emit('permission-error', permissionError);
            errorMessage = 'Failed to create user in Firestore due to permissions.';
        }
        toast({ variant: 'destructive', title: t('common.error'), description: errorMessage });
    }
  };
  
  const handleUpdateUser = async (data: z.infer<typeof userSchema>) => {
    if(!authUser || !firestore || !editingUser) return;
    try {
        await updateUserProfile(firestore, editingUser.uid, {name: data.name, email: data.email, role: data.role});
        await logAction(firestore, authUser.uid, 'update', 'user', editingUser.uid, `Updated user profile`);
        toast({ title: t('common.success'), description: t('users.userUpdated') });
        setIsFormOpen(false);
        setEditingUser(null);
        fetchUsers();
    } catch {
        toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to update user.'});
    }
  }

  const handleStatusToggle = async (userToToggle: UserProfile) => {
    if (!authUser || !firestore) return;
    const newStatus = !userToToggle.isActive;
    try {
        await updateUserProfile(firestore, userToToggle.uid, { isActive: newStatus });
        await logAction(firestore, authUser.uid, 'update', 'user', userToToggle.uid, `Set status to ${newStatus ? 'active' : 'inactive'}`);
        toast({ title: t('common.success'), description: t('users.userStatusUpdated') });
        fetchUsers();
    } catch {
        toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to update user status.' });
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!authUser || !firestore) {
        toast({ variant: 'destructive', title: t('common.error'), description: 'Could not delete user. Firebase not available.' });
        return;
    }
    try {
        await deleteUserFromDb(firestore, uid);
        await logAction(firestore, authUser.uid, 'delete', 'user', uid, `Deleted user`);
        toast({ title: t('common.success'), description: t('users.userDeleted') });
        fetchUsers();
    } catch(error) {
        toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to delete user.' });
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: t('common.success'),
        description: `${t('users.passwordResetSent')} ${email}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message,
      });
    }
  };
  
  const openEditForm = (user: UserProfile) => {
    setEditingUser(user);
    setIsFormOpen(true);
  }
  
  const openNewForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const tableColumns = useMemo(() => columns({ openEditForm, handleDelete: handleDeleteUser, handleStatusToggle, currentUser, t, handlePasswordReset }), [users, currentUser, t, fetchUsers]);
  
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
        const isAdministrator = currentUser?.role === 'administrator';
        return (
            <AlertDialog key={user.uid}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className='text-lg'>{user.name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
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
                          {isAdministrator && !isCurrentUser && (
                            <DropdownMenuItem onClick={() => handlePasswordReset(user.email)}>
                              {t('users.resetPassword')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive" disabled={isCurrentUser}>{t('users.deleteUser')}</DropdownMenuItem>
                          </AlertDialogTrigger>
                          </DropdownMenuContent>
                      </DropdownMenu>
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
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>{t('users.deleteUser')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('users.deleteUserConfirm')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteUser(user.uid)} className="bg-destructive hover:bg-destructive/90">
                      {t('common.delete')}
                  </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
        {currentUser && (currentUser.role === 'administrator' || currentUser.role === 'bishop') && (
            <Button onClick={openNewForm}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('users.addUser')}
            </Button>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingUser(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={formSubmitHandler as any} defaultValues={formDefaultValues} isEditMode={!!editingUser} t={t} />
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

    
