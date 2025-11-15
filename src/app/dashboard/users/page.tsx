'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getUsers, logAction, updateUserProfile } from '@/lib/firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from './data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserForm from '@/components/dashboard/users/user-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { signUpUser } from '@/lib/firebase/auth';
import { userSchema as zodUserSchema } from '@/lib/schemas';
import { z } from 'zod';

type UserFormValues = z.infer<typeof zodUserSchema>;

export default function UsersPage() {
  const { role, user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (role && role !== 'bishop') {
      router.replace('/dashboard');
    } else if (role === 'bishop') {
      fetchUsers();
    }
  }, [role, router, fetchUsers]);


  const handleCreateUser = async (data: UserFormValues) => {
    if (!user) return;
    try {
      if (!data.password) throw new Error("Password is required for new users.");
      
      const newUserCredential = await signUpUser(data.email, data.password, data.name, data.role, user.uid);
      
      toast({ title: 'Success', description: 'User created successfully.' });
      await logAction(user.uid, 'create', 'user', newUserCredential.user.uid, `Created user ${data.email}`);
      setIsFormOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create user.' });
    }
  };

  if (role !== 'bishop') {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">User Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage user accounts.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={handleCreateUser} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable columns={columns({ fetchUsers, currentUser: userProfile })} data={users} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
