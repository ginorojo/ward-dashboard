'use client';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from './settings/theme-toggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';

export default function DashboardHeader() {
  const { userProfile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <div className="flex-1">
        {/* Can add breadcrumbs or page title here if needed */}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 focus:outline-none">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{userProfile?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userProfile?.role}</p>
                </div>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name}`} alt={userProfile?.name} />
                    <AvatarFallback>{userProfile?.name ? getInitials(userProfile.name) : 'U'}</AvatarFallback>
                </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className='w-56'>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
