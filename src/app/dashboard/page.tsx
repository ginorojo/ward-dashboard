'use client';
import { useFirebase, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenCheck, CalendarCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardHomePage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    users: 0,
    interviews: 0,
    agendas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && firestore) {
      const fetchProfileAndStats = async () => {
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }

          const [usersSnapshot, interviewsSnapshot, agendasSnapshot] = await Promise.all([
            getDocs(collection(firestore, 'users')),
            getDocs(collection(firestore, 'interviews')),
            getDocs(collection(firestore, 'sacramentMeetings')),
          ]);
          setStats({
            users: usersSnapshot.size,
            interviews: interviewsSnapshot.size,
            agendas: agendasSnapshot.size,
          });
        } catch (error) {
          console.error("Failed to fetch dashboard stats:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfileAndStats();
    } else if (!isUserLoading) {
      setLoading(false);
    }
  }, [user, firestore, isUserLoading]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome, {loading ? '...' : userProfile?.name}</h1>
        <p className="text-muted-foreground">Here's an overview of your ward's activities.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Interviews</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.interviews}</div>
            <p className="text-xs text-muted-foreground">Total scheduled interviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sacrament Agendas</CardTitle>
            <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.agendas}</div>
            <p className="text-xs text-muted-foreground">Total created agendas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
