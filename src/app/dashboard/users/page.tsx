'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { getCollection, updateUserProfile, logAction, addDocument } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DataTable } from '@/components/dashboard/users/data-table';
import { columns } from '@/components/dashboard/users/columns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UserForm from '@/components/dashboard/users/user-form';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { userSchema } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';

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
      // Note: This only creates user in Firestore. Auth user must be created separately.
      // This form is for management, assuming auth user is created elsewhere or not needed.
      const userId = await addDocument(firestore, 'users', {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: true,
      }, authUser.uid, 'user');
      
      toast({ title: t('common.success'), description: t('users.userCreated') });
      setIsFormOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message || 'Failed to create user.' });
    }
  };

  const tableColumns = useMemo(() => columns({ fetchUsers, currentUser, t }), [fetchUsers, currentUser, t]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.description')}</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('users.addUser')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('users.createNewUser')}</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={handleCreateUser} t={t} />
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
         <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-40 w-full" />
         </div>
      ) : (
        <DataTable columns={tableColumns} data={users} t={t}/>
      )}
    </div>
  );
}
