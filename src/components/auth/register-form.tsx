'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { userSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// We omit password confirmation from the type that goes to the server.
const registerSchema = userSchema.extend({
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
type RegisterFormValues = z.infer<typeof registerSchema>;


export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'secretary',
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setLoading(true);
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: 'Firebase not initialized. Please try again later.',
        });
        setLoading(false);
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
          const userDocRef = doc(firestore, 'users', userCredential.user.uid);
          const userData = {
            uid: userCredential.user.uid,
            email: data.email,
            name: data.name,
            role: data.role,
            createdAt: serverTimestamp(),
            createdBy: userCredential.user.uid, // Self-created
            isActive: true,
          };
          
          setDoc(userDocRef, userData)
            .then(() => {
                toast({
                    title: 'Registration Successful',
                    description: 'Your account has been created.',
                });
                router.push('/dashboard');
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'create',
                    requestResourceData: userData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'Could not create account. Please try again.',
      });
    } finally {
      // Don't set loading to false here, as we navigate away on success
      // and want to keep the loader spinning during the Firestore operation.
      // The toast for auth errors will appear, and the user can retry.
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
