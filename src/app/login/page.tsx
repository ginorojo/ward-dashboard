import LoginForm from '@/components/auth/login-form';
import Logo from '@/components/icons/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Logo className="h-12 w-12 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">Ward Dashboard</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
