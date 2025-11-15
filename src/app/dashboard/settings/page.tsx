import ThemeToggle from '@/components/dashboard/settings/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import ProfileCard from '@/components/dashboard/settings/profile-card';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
       <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </div>

      <ProfileCard />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="theme-toggle" className="flex flex-col space-y-1">
              <span>Theme</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Select between light and dark mode.
              </span>
            </Label>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
