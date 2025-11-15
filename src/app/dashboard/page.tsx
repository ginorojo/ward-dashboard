'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenCheck, CalendarCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCollection } from '@/lib/firebase/firestore';
import { Interview, SacramentMeeting, UserProfile } from '@/lib/types';

export default function DashboardHomePage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    interviews: 0,
    agendas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, interviewsData, agendasData] = await Promise.all([
          getCollection<UserProfile>('users'),
          getCollection<Interview>('interviews'),
          getCollection<SacramentMeeting>('sacramentMeetings'),
        ]);
        setStats({
          users: usersData.length,
          interviews: interviewsData.length,
          agendas: agendasData.length,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.name}</h1>
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
