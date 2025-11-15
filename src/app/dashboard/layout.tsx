'use client';

import { useUser, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import SidebarNav from '@/components/dashboard/sidebar-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

export interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  role: string | null;
  loading: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    } else if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
        setLoadingProfile(false);
      });
    }
  }, [user, isUserLoading, router, firestore]);

  const loading = isUserLoading || loadingProfile;

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-card">
         <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarNav userProfile={userProfile} />
        </Sidebar>
        <div className="flex-1 flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
                {children}
            </main>
        </div>
    </SidebarProvider>
  );
}
