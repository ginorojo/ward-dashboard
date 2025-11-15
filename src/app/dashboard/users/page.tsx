'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { getCollection, updateUserProfile, logAction, deleteUser } from '@/lib/firebase/firestore';
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import React from 'react';

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

  useEffect(() => {
    const fetchUsers = async () => {
      if (!firestore || !authUser) return;
      setLoading(true);
      try {
        const usersList = await getCollection<UserProfile>(firestore, 'users', { field: 'createdAt', direction: 'desc' });
        setUsers(usersList);
        const currentUserProfile = usersList.find(u => u.uid === authUser.uid);
        setCurrentUser(currentUserProfile || null);
      } catch (error) {
        toast({ variant: 'destructive', title: t('common.error'), description: t('users.fetchFailed') });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [firestore, authUser, t, toast]);


  const handleCreateUser = async (data: UserFormValues) => {
    if (!authUser || !firestore || !auth) return;
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password!);
      const newUid = userCredential.user.uid;

      // 2. Create user document in Firestore
      const userDocRef = doc(firestore, 'users', newUid);
      const userDocData = {
        uid: newUid,
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: true,
        createdBy: authUser.uid,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, userDocData);

      await logAction(firestore, authUser.uid, 'create', 'user', newUid, `Created user with role ${data.role}`);
      
      toast({ title: t('common.success'), description: t('users.userCreated') });
      setUsers(prevUsers => [...prevUsers, { ...userDocData, createdAt: new Date() } as unknown as UserProfile]);
      setIsFormOpen(false);
    } catch (error: any) {
        if (error.code && error.code.startsWith('auth/')) {
             toast({ variant: 'destructive', title: t('auth.registrationFailed'), description: error.message });
        } else {
             // Assume Firestore error if not an auth error
            const permissionError = new FirestorePermissionError({
                path: `users`,
                operation: 'create',
                requestResourceData: { email: data.email, role: data.role },
            });
            errorEmitter.emit('permission-error', permissionError);
             toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to create user in Firestore.' });
        }
    }
  };
  
  const handleUpdateUser = (data: z.infer<typeof userSchema>) => {
    if(!authUser || !firestore || !editingUser) return;
    
    const updateData = {name: data.name, email: data.email, role: data.role};

    updateUserProfile(firestore, editingUser.uid, updateData).then(() => {
        logAction(firestore, authUser.uid, 'update', 'user', editingUser.uid, `Updated user profile`);
        toast({ title: t('common.success'), description: t('users.userUpdated') });
        setUsers(prevUsers => prevUsers.map(u => u.uid === editingUser.uid ? {...u, ...updateData} : u));
        setIsFormOpen(false);
        setEditingUser(null);
    });
  }

 const handleStatusToggle = useCallback((userToToggle: UserProfile) => {
    if (!authUser || !firestore) return;
    const newStatus = !userToToggle.isActive;
    updateUserProfile(firestore, userToToggle.uid, { isActive: newStatus }).then(() => {
        logAction(firestore, authUser.uid, 'update', 'user', userToToggle.uid, `Set status to ${newStatus ? 'active' : 'inactive'}`);
        toast({ title: t('common.success'), description: t('users.userStatusUpdated') });
        setUsers(currentUsers =>
            currentUsers.map(user =>
                user.uid === userToToggle.uid ? { ...user, isActive: newStatus } : user
            )
        );
    }).catch(() => {
        toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to update user status.' });
    });
}, [firestore, authUser, toast, t]);
  
  const handleDeleteUser = useCallback((uid: string) => {
    if (!authUser || !firestore) {
        toast({ variant: 'destructive', title: t('common.error'), description: 'Could not delete user. Firebase not available.' });
        return;
    }
    deleteUser(firestore, uid);
    logAction(firestore, authUser.uid, 'delete', 'user', uid, `Deleted user`);
    toast({ title: t('common.success'), description: t('users.userDeleted') });
    setUsers(currentUsers => currentUsers.filter(user => user.uid !== uid));
  }, [firestore, authUser, t, toast]);
  
  const openEditForm = (user: UserProfile) => {
    setEditingUser(user);
    setIsFormOpen(true);
  }
  
  const openNewForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const tableColumns = useMemo(() => columns({ openEditForm, handleDelete: handleDeleteUser, handleStatusToggle, currentUser, t }), [currentUser, t, handleDeleteUser, handleStatusToggle]);
  
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

    