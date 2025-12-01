'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Play,
  Trophy,
  Users,
  Flame,
  Target,
  Dumbbell,
  Heart,
  Star,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@fitquest/ui';

const features = [
  {
    icon: Trophy,
    title: 'RPG 스타일 레벨업',
    description: '운동할수록 레벨업! 스탯을 올리고 칭호를 획득하세요.',
  },
  {
    icon: Flame,
    title: '스트릭 시스템',
    description: '매일 운동하고 연속 기록을 세우세요. 보상이 기다립니다.',
  },
  {
    icon: Target,
    title: 'AI 퍼스널 코치',
    description: '당신만을 위한 맞춤형 운동 계획을 AI가 설계합니다.',
  },
  {
    icon: Users,
    title: '소셜 챌린지',
    description: '친구와 함께 도전하고 리더보드에서 경쟁하세요.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '무료',
    description: '운동 습관 시작하기',
    features: ['월 8회 운동 영상', 'AI 코치 3회/월', '기본 업적', '커뮤니티 접근'],
    cta: '시작하기',
    popular: false,
  },
  {
    name: 'Premium',
    price: '₩9,900',
    period: '/월',
    description: '본격적인 피트니스 여정',
    features: [
      '무제한 운동 영상',
      'AI 코치 20회/월',
      '맞춤 운동 계획',
      '광고 없음',
      '오프라인 다운로드',
      '상세 통계',
    ],
    cta: '프리미엄 시작',
    popular: true,
  },
  {
    name: 'Premium+',
    price: '₩19,900',
    period: '/월',
    description: '프로처럼 운동하기',
    features: [
      'Premium 전체 포함',
      '무제한 AI 코치',
      '라이브 클래스',
      '1:1 코칭 세션',
      '우선 지원',
      '전용 콘텐츠',
    ],
    cta: 'Premium+ 시작',
    popular: false,
  },
];

const stats = [
  { label: '활성 사용자', value: '50,000+' },
  { label: '완료된 운동', value: '1,000,000+' },
  { label: '소모된 칼로리', value: '500M+' },
  { label: '평균 평점', value: '4.9' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-emerald-500" />
            <span className="text-xl font-bold">FitQuest</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              기능
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              요금제
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              로그인
            </Link>
            <Link href="/signup">
              <Button variant="gradient">무료로 시작</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
              <Star className="h-4 w-4" />
              게이미피케이션 피트니스 플랫폼
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
          >
            운동을{' '}
            <span className="text-gradient-primary">RPG처럼</span>
            <br />
            즐기세요
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground md:text-xl"
          >
            레벨업하고, 업적을 달성하고, 친구와 경쟁하세요.
            <br />
            FitQuest와 함께라면 운동이 게임처럼 재미있어집니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/signup">
              <Button size="xl" variant="gradient" className="w-full sm:w-auto">
                <Play className="mr-2 h-5 w-5" />
                무료로 시작하기
              </Button>
            </Link>
            <Link href="#features">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                자세히 알아보기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              운동을 더 재미있게 만드는 기능들
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              게이미피케이션 요소로 운동 동기를 높이고, AI 코치로 효과를 극대화하세요.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <feature.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Preview */}
      <section className="bg-gradient-to-br from-violet-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                운동이 게임이 되는 순간
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                매 운동마다 경험치를 얻고 레벨업하세요. 다양한 업적과 메달을 수집하고,
                친구들과 리더보드에서 경쟁하며 동기를 유지하세요.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  '레벨 시스템: 운동할수록 성장하는 캐릭터',
                  '스탯 시스템: 근력, 지구력, 유연성 등 능력치 상승',
                  '업적 & 메달: 50+ 업적과 시즌 메달 컬렉션',
                  '리더보드: 친구와 전 세계 사용자와 경쟁',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100">
                      <Check className="h-4 w-4 text-violet-600" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 p-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20" />
                  <div>
                    <div className="text-2xl font-bold">피트니스 워리어</div>
                    <div className="text-white/80">Lv.15 | 2,450 XP</div>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  {[
                    { name: '근력', value: 78, color: 'bg-red-400' },
                    { name: '지구력', value: 65, color: 'bg-blue-400' },
                    { name: '유연성', value: 52, color: 'bg-green-400' },
                    { name: '밸런스', value: 45, color: 'bg-amber-400' },
                  ].map((stat, index) => (
                    <div key={index}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{stat.name}</span>
                        <span>{stat.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/20">
                        <div
                          className={`h-full ${stat.color} rounded-full`}
                          style={{ width: `${stat.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex gap-2">
                  {['🏆', '🔥', '💪', '⭐', '🎯'].map((emoji, index) => (
                    <div
                      key={index}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              당신에게 맞는 요금제를 선택하세요
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              무료로 시작하고, 필요할 때 업그레이드하세요.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl border p-8 ${
                  plan.popular
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                    : 'bg-card shadow-sm'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-sm font-medium text-white">
                    인기
                  </span>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.popular ? 'gradient' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-emerald-500 to-teal-500 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            지금 시작하세요
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            50,000명 이상의 사용자들이 FitQuest로 건강한 습관을 만들고 있습니다.
            지금 무료로 시작하고 운동의 재미를 발견하세요.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="xl" className="bg-white text-emerald-600 hover:bg-white/90">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-emerald-500" />
              <span className="text-lg font-bold">FitQuest</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">
                이용약관
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                개인정보처리방침
              </Link>
              <Link href="/support" className="hover:text-foreground">
                고객센터
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 FitQuest. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
