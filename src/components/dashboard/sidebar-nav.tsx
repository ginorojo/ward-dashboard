'use client'

import { usePathname, useRouter } from 'next/navigation';
import { BookOpenCheck, BookUser, CalendarCheck, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react';
import { SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import Logo from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { signOutUser } from '@/lib/firebase/auth';
import { Separator } from '../ui/separator';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/users', label: 'Users', icon: Users, roles: ['bishop'] },
    { href: '/dashboard/interviews', label: 'Interviews', icon: CalendarCheck },
    { href: '/dashboard/bishopric-meeting', label: 'Bishopric Meeting', icon: BookUser },
    { href: '/dashboard/sacrament-meeting', label: 'Sacrament Meeting', icon: BookOpenCheck },
]

const bottomNavItems = [
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function SidebarNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { role, userProfile } = useAuth();

    const handleLogout = async () => {
        await signOutUser();
        router.push('/login');
    }

    const filteredNavItems = navItems.filter(item => !item.roles || (role && item.roles.includes(role)));

    return (
        <>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Logo className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-semibold text-foreground font-headline">Ward Dashboard</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {filteredNavItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                onClick={() => router.push(item.href)}
                                isActive={pathname === item.href}
                                tooltip={item.label}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <Separator className='my-2' />
                 <SidebarMenu>
                    {bottomNavItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                onClick={() => router.push(item.href)}
                                isActive={pathname === item.href}
                                tooltip={item.label}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </>
    )
}
