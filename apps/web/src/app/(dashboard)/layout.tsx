'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Dumbbell,
  Trophy,
  BarChart3,
  User,
  Settings,
  Menu,
  X,
  Target,
  Users,
  Utensils,
  Bot,
  Crown,
  Bell,
} from 'lucide-react';
import { Button, Avatar, AvatarFallback, AvatarImage, Badge, cn } from '@fitquest/ui';

const navItems = [
  { href: '/dashboard', icon: Home, label: '홈' },
  { href: '/workouts', icon: Dumbbell, label: '운동' },
  { href: '/challenges', icon: Target, label: '챌린지' },
  { href: '/coach', icon: Bot, label: 'AI 코치' },
  { href: '/nutrition', icon: Utensils, label: '영양' },
  { href: '/stats', icon: BarChart3, label: '통계' },
  { href: '/leaderboard', icon: Trophy, label: '리더보드' },
  { href: '/friends', icon: Users, label: '친구' },
];

const bottomNavItems = [
  { href: '/dashboard', icon: Home, label: '홈' },
  { href: '/workouts', icon: Dumbbell, label: '운동' },
  { href: '/challenges', icon: Target, label: '챌린지' },
  { href: '/stats', icon: BarChart3, label: '통계' },
  { href: '/profile', icon: User, label: '프로필' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock user data
  const user = {
    username: 'FitWarrior',
    avatar: null,
    level: 15,
    subscription: 'premium',
    streak: 12,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-white lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Dumbbell className="h-8 w-8 text-emerald-500" />
            <span className="text-xl font-bold">FitQuest</span>
          </div>

          {/* User Info */}
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-emerald-500/50">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {user.level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{user.username}</span>
                  {user.subscription === 'premium' && (
                    <Crown className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>🔥</span>
                  <span>{user.streak}일 연속</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="border-t p-4 space-y-2">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              설정
            </Link>
            <Link href="/subscription">
              <Button variant="gradient" className="w-full">
                <Crown className="mr-2 h-4 w-4" />
                프리미엄 업그레이드
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-emerald-500" />
            <span className="font-bold">FitQuest</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-y-0 right-0 z-50 w-80 bg-white lg:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <span className="font-bold">메뉴</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="min-h-screen pb-20 pt-14 lg:pb-8 lg:pt-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white safe-bottom lg:hidden">
        <div className="grid h-16 grid-cols-5">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs',
                  isActive ? 'text-emerald-600' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
