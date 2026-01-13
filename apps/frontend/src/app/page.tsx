import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Hospital ERP System</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Hospital Inpatient Management ERP System
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <a href="/login">Login</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Dashboard</a>
        </Button>
      </div>
    </div>
  );
}
