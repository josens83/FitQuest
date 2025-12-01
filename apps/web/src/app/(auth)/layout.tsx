import { Dumbbell } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-emerald-500" />
            <span className="text-xl font-bold">FitQuest</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-screen items-center justify-center p-4 pt-16">
        {children}
      </main>
    </div>
  );
}
