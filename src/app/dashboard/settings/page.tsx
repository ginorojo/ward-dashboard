'use client';
import ThemeToggle from '@/components/dashboard/settings/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import ProfileCard from '@/components/dashboard/settings/profile-card';
import { useTranslation } from '@/lib/i18n';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
       <div>
        <h1 className="text-3xl font-bold font-headline">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <ProfileCard t={t} />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance')}</CardTitle>
          <CardDescription>{t('settings.appearanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="theme-toggle" className="flex flex-col space-y-1">
              <span>{t('settings.theme')}</span>
              <span className="font-normal leading-snug text-muted-foreground">
                {t('settings.themeDescription')}
              </span>
            </Label>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
