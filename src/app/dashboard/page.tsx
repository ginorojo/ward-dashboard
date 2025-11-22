'use client';
import { useFirebase, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenCheck, CalendarCheck, Users, Handshake } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n';

export default function DashboardHomePage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    users: 0,
    interviews: 0,
    reuniones: 0,
    agendas: 0,
  });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();


  useEffect(() => {
    if (user && firestore) {
      const fetchProfileAndStats = async () => {
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }

          const interviewsQuery = query(collection(firestore, 'interviews'), where('status', '==', 'pending'));
          const reunionesQuery = query(collection(firestore, 'reuniones'), where('status', '==', 'pending'));

          const [usersSnapshot, interviewsSnapshot, reunionesSnapshot, agendasSnapshot] = await Promise.all([
            getDocs(collection(firestore, 'users')),
            getDocs(interviewsQuery),
            getDocs(reunionesQuery),
            getDocs(collection(firestore, 'sacramentMeetings')),
          ]);
          setStats({
            users: usersSnapshot.size,
            interviews: interviewsSnapshot.size,
            reuniones: reunionesSnapshot.size,
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
        <h1 className="text-3xl font-bold font-headline">{t('dashboard.welcome')}, {loading ? '...' : userProfile?.name}</h1>
        <p className="text-muted-foreground">{t('dashboard.overview')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.pendingInterviews')}</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.interviews}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.totalScheduled')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.pendingMeetings')}</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.reuniones}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.totalScheduledMeetings')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.sacramentAgendas')}</CardTitle>
            <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.agendas}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.totalCreatedAgendas')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
