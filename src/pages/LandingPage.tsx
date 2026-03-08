import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Star } from '@phosphor-icons/react';

// 3D badge icons
import icoDashboard from '@/assets/icons/icon-dashboard.svg';
import icoJournal from '@/assets/icons/icon-journal.svg';
import icoGoals from '@/assets/icons/icon-goals.svg';
import icoHabits from '@/assets/icons/icon-habits.svg';
import icoSystems from '@/assets/icons/icon-systems.svg';
import icoAnalytics from '@/assets/icons/icon-analytics.svg';
import icoMorning from '@/assets/icons/icon-morning.svg';
import icoReview from '@/assets/icons/icon-review.svg';
import icoVision from '@/assets/icons/icon-vision.svg';
import icoTarget from '@/assets/icons/icon-target.svg';
import icoLightning from '@/assets/icons/icon-lightning.svg';
import icoSparkle from '@/assets/icons/icon-sparkle.svg';
import icoFire from '@/assets/icons/icon-fire.svg';
import icoStar from '@/assets/icons/icon-star.svg';
import icoTrophy from '@/assets/icons/icon-trophy.svg';
import icoCalendar from '@/assets/icons/icon-calendar.svg';

/* ─── Feature data ───────────────────────────────────────── */
const FEATURES = [
  {
    badge: icoDashboard,
    title: 'Command Center',
    desc: 'See your entire day at a glance — events, habits, goals, and priorities unified in one dashboard.',
  },
  {
    badge: icoJournal,
    title: 'Daily Journal',
    desc: 'Capture energy levels, gratitude, wins, and lessons with guided prompts that build self-awareness.',
  },
  {
    badge: icoGoals,
    title: 'Goal Tracking',
    desc: 'Break ambitious goals into milestones. Track progress with visual indicators and celebrate wins.',
  },
  {
    badge: icoHabits,
    title: 'Habit Streaks',
    desc: 'Build unbreakable routines with streak tracking, completion rates, and motivational momentum.',
  },
  {
    badge: icoSystems,
    title: 'Life Systems',
    desc: 'Design repeatable systems for every area of life — health, career, learning, and relationships.',
  },
  {
    badge: icoAnalytics,
    title: 'Deep Analytics',
    desc: 'Understand your patterns with beautiful charts — energy trends, habit consistency, and focus time.',
  },
  {
    badge: icoMorning,
    title: 'Morning Briefing',
    desc: 'Start each day with a personalized briefing — weather, schedule, priorities, and affirmations.',
  },
  {
    badge: icoReview,
    title: 'Weekly Review',
    desc: 'Reflect on your week with structured reviews that compound into transformative self-knowledge.',
  },
  {
    badge: icoVision,
    title: 'Vision Board',
    desc: 'Visualize your ideal future across career, health, finance, and personal growth categories.',
  },
];

const STATS = [
  { value: '10+', label: 'Productivity tools', badge: icoLightning },
  { value: '∞', label: 'Custom systems', badge: icoSystems },
  { value: '365', label: 'Days of journaling', badge: icoFire },
  { value: '100%', label: 'Privacy first', badge: icoTarget },
];

const TESTIMONIALS = [
  {
    quote: 'This replaced 5 different apps for me. Everything I need is in one beautiful interface.',
    name: 'Sarah K.',
    role: 'Product Designer',
    stars: 5,
  },
  {
    quote: 'The morning briefing alone changed how I start my day. I feel 10x more intentional.',
    name: 'Marcus T.',
    role: 'Startup Founder',
    stars: 5,
  },
  {
    quote: 'Finally a system that adapts to me, not the other way around. Absolutely love the vision board.',
    name: 'Priya S.',
    role: 'Engineering Manager',
    stars: 5,
  },
];

/* ─── Component ──────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={icoCalendar} alt="" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-semibold tracking-tight">System Calendar</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/[0.06]">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full px-5 font-medium">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-[#0071e3]/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-sm text-white/60 mb-8">
            <img src={icoSparkle} alt="" width={18} height={18} />
            <span>Your entire life, systematized</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            The operating system
            <br />
            <span className="bg-gradient-to-r from-[#0071e3] via-[#5AC8FA] to-[#BF5AF2] bg-clip-text text-transparent">
              for your life.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Journals, goals, habits, systems, vision boards, and analytics —
            unified in one beautiful dark interface designed to help you become unstoppable.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/signup">
              <Button size="lg" className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full px-8 h-12 text-base font-medium gap-2">
                Start for free <ArrowRight className="h-4 w-4" weight="bold" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white"
              >
                See features
              </Button>
            </a>
          </div>

          {/* Floating icon orbit */}
          <div className="relative mt-20 h-[280px] hidden sm:block">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
              {[icoJournal, icoGoals, icoHabits, icoSystems, icoAnalytics, icoMorning, icoReview, icoVision].map(
                (ico, i) => {
                  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
                  const rx = 220, ry = 110;
                  const x = 250 + rx * Math.cos(angle);
                  const y = 250 + ry * Math.sin(angle);
                  return (
                    <img
                      key={i}
                      src={ico}
                      alt=""
                      width={52}
                      height={52}
                      className="absolute rounded-2xl shadow-2xl shadow-black/60 transition-transform duration-500 hover:scale-125"
                      style={{
                        left: x - 26,
                        top: y - 26,
                        animation: `float-${i} 6s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    />
                  );
                },
              )}
              {/* Center icon */}
              <img
                src={icoDashboard}
                alt=""
                width={72}
                height={72}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[20px] shadow-2xl shadow-[#0071e3]/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 py-10 px-6">
          {STATS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2 py-4">
              <img src={s.badge} alt="" width={36} height={36} className="rounded-xl mb-1" />
              <span className="text-3xl font-bold tracking-tight">{s.value}</span>
              <span className="text-sm text-white/40">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Everything you need.
              <br />
              <span className="text-white/40">Nothing you don't.</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">
              Nine powerful modules that work together seamlessly — so you can focus on what matters.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300"
              >
                <img src={f.badge} alt="" width={48} height={48} className="rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-white/[0.015]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-16">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', badge: icoSparkle, title: 'Set Up Your Systems', desc: 'Define the areas of your life — career, health, finance, learning — and create repeatable systems for each.' },
              { step: '02', badge: icoFire, title: 'Build Daily Rituals', desc: 'Use morning briefings, journals, and habit tracking to stay consistent every single day.' },
              { step: '03', badge: icoTrophy, title: 'Review & Evolve', desc: 'Weekly reviews and analytics reveal your patterns, so you continuously optimize and grow.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <span className="text-6xl font-bold text-white/[0.06] block mb-4">{s.step}</span>
                <img src={s.badge} alt="" width={56} height={56} className="rounded-2xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
            Loved by builders
          </h2>
          <p className="text-center text-white/40 mb-14">People who take their growth seriously.</p>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400" weight="fill" />
                  ))}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-5">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-white/30">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ───────────────────────────────── */}
      <section className="py-24 px-6 bg-white/[0.015]">
        <div className="max-w-lg mx-auto text-center">
          <img src={icoStar} alt="" width={56} height={56} className="rounded-2xl mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Free. Forever.
          </h2>
          <p className="text-white/40 mb-3 leading-relaxed">
            All features. Unlimited entries. No credit card. No catch.
          </p>
          <div className="flex flex-col items-center gap-2 text-sm text-white/50 mb-8">
            {['All 9 productivity modules', 'Unlimited journal entries', 'Full analytics dashboard', 'Dark mode by default'].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" weight="bold" />
                {item}
              </span>
            ))}
          </div>
          <Link to="/signup">
            <Button size="lg" className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full px-10 h-12 text-base font-medium gap-2">
              Get started now <ArrowRight className="h-4 w-4" weight="bold" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0071e3]/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Your best self
            <br />
            <span className="bg-gradient-to-r from-[#0071e3] to-[#5AC8FA] bg-clip-text text-transparent">
              starts today.
            </span>
          </h2>
          <p className="text-lg text-white/40 mb-10">
            Join thousands who've transformed their daily routines into unstoppable systems.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-full px-10 h-14 text-lg font-semibold gap-2">
              Create free account <ArrowRight className="h-5 w-5" weight="bold" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <img src={icoCalendar} alt="" width={20} height={20} className="rounded opacity-50" />
            <span>© 2026 System Calendar. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <Link to="/login" className="hover:text-white/60 transition-colors">Sign in</Link>
            <Link to="/signup" className="hover:text-white/60 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

      {/* ── FLOATING ANIMATION KEYFRAMES ─────────────────── */}
      <style>{`
        ${Array.from({ length: 8 })
          .map(
            (_, i) => `
          @keyframes float-${i} {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(${-8 - (i % 3) * 4}px); }
          }
        `,
          )
          .join('')}
      `}</style>
    </div>
  );
}
