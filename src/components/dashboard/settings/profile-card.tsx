'use client';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ProfileCard() {
  const { userProfile } = useAuth();

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
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.name}`} alt={userProfile.name} />
            <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{userProfile.name}</h3>
            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Role</p>
            <Badge variant="secondary" className="capitalize mt-1">{userProfile.role}</Badge>
          </div>
          <div>
            <p className="font-medium">Account Created</p>
            <p className="text-muted-foreground mt-1">
              {userProfile.createdAt ? format(userProfile.createdAt.toDate(), 'PPP') : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
