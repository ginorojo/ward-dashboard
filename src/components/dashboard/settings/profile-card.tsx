'use client';

import { useUser, useFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { profileSchema } from '@/lib/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { Pencil, Loader2 } from 'lucide-react';

type ProfileFormValues = z.infer<typeof profileSchema>;


export default function ProfileCard({ t }: { t: (key: string) => string }) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile?.name || '',
    },
  });

  const fetchUserProfile = () => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setUserProfile(profile);
          form.reset({ name: profile.name });
        }
      });
    }
  };

  useEffect(() => {
    if(user && firestore) {
      fetchUserProfile();
    }
  }, [user, firestore]);


  const { isSubmitting } = form.formState;

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !firestore) return;
    try {
      await updateUserProfile(firestore, user.uid, data);
      toast({ title: t('common.success'), description: t('settings.profileUpdated') });
      setIsFormOpen(false);
      fetchUserProfile(); // Re-fetch profile
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('settings.profileUpdateFailed') });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  if (!userProfile) {
    return null;
  }

  return (
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>{t('settings.profileInfo')}</CardTitle>
                    <CardDescription className="mt-1">{t('settings.profileDescription')}</CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    </DialogTrigger>
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('settings.editProfile')}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('users.fullName')}</FormLabel>
                                <FormControl>
                                <Input placeholder={t('users.fullName')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('common.save')}
                        </Button>
                        </form>
                    </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.name}`} alt={userProfile.name} />
              <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
            </Avatar>
            <div className='text-center sm:text-left'>
              <h3 className="text-lg font-semibold">{userProfile.name}</h3>
              <p className="text-sm text-muted-foreground">{userProfile.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4">
            <div>
              <p className="font-medium">{t('common.role')}</p>
              <Badge variant="secondary" className="capitalize mt-1">{userProfile.role}</Badge>
            </div>
            <div>
              <p className="font-medium">{t('settings.accountCreated')}</p>
              <p className="text-muted-foreground mt-1">
                {userProfile.createdAt ? format((userProfile.createdAt as any).toDate(), 'PPP') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
