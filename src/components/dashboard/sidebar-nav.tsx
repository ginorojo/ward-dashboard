'use client'

import { usePathname, useRouter } from 'next/navigation';
import { BookOpenCheck, BookUser, CalendarCheck, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react';
import { SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import Logo from '@/components/icons/logo';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Separator } from '../ui/separator';
import { UserProfile } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

export default function SidebarNav({ userProfile }: { userProfile: UserProfile | null }) {
    const pathname = usePathname();
    const router = useRouter();
    const auth = useAuth();
    const { user } = useUser();
    const { t } = useTranslation();
    const { isMobile, setOpenMobile } = useSidebar();

    const handleNavigate = (href: string) => {
        router.push(href);
        if (isMobile) {
            setOpenMobile(false);
        }
    }

    // Determine role, giving precedence to the special email address.
    const isAdministrator = user?.email === 'ginorojoj@gmail.com';
    const role = isAdministrator ? 'administrator' : userProfile?.role;


    const navItems = [
        { href: '/dashboard', label: t('dashboard.title'), icon: LayoutDashboard },
        { href: '/dashboard/users', label: t('dashboard.users'), icon: Users, roles: ['administrator', 'bishop'] },
        { href: '/dashboard/interviews', label: t('dashboard.interviews'), icon: CalendarCheck },
        { href: '/dashboard/bishopric-meeting', label: t('dashboard.bishopricMeeting'), icon: BookUser },
        { href: '/dashboard/sacrament-meeting', label: t('dashboard.sacramentMeeting'), icon: BookOpenCheck },
    ]
    
    const bottomNavItems = [
        { href: '/dashboard/settings', label: t('dashboard.settings'), icon: Settings },
    ]

    const handleLogout = async () => {
        await signOut(auth);
        if (isMobile) {
            setOpenMobile(false);
        }
        router.push('/login');
    }

    const filteredNavItems = navItems.filter(item => !item.roles || (role && item.roles.includes(role)));

    return (
        <>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Logo className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-semibold text-foreground font-headline">{t('dashboard.title')}</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {filteredNavItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                onClick={() => handleNavigate(item.href)}
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
                                onClick={() => handleNavigate(item.href)}
                                isActive={pathname === item.href}
                                tooltip={item.label}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip={t('dashboard.logout')}>
                            <LogOut />
                            <span>{t('dashboard.logout')}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </>
    )
}
