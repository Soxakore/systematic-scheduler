import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Star } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import HeroLoginSection from '@/components/landing/HeroLoginSection';
import CursorSparkle from '@/components/landing/CursorSparkle';
import FloatingOrbs from '@/components/landing/FloatingOrbs';
import GlowCard from '@/components/landing/GlowCard';

import icoLightning from '@/assets/icons/icon-lightning.svg';
import icoSystems from '@/assets/icons/icon-systems.svg';
import icoFire from '@/assets/icons/icon-fire.svg';
import icoTarget from '@/assets/icons/icon-target.svg';
import icoStar from '@/assets/icons/icon-star.svg';
import icoSparkle from '@/assets/icons/icon-sparkle.svg';
import icoTrophy from '@/assets/icons/icon-trophy.svg';
import icoCalendar from '@/assets/icons/icon-calendar.svg';
import icoDashboard from '@/assets/icons/icon-dashboard.svg';
import icoJournal from '@/assets/icons/icon-journal.svg';
import icoGoals from '@/assets/icons/icon-goals.svg';
import icoHabits from '@/assets/icons/icon-habits.svg';
import icoAnalytics from '@/assets/icons/icon-analytics.svg';
import icoMorning from '@/assets/icons/icon-morning.svg';
import icoReview from '@/assets/icons/icon-review.svg';
import icoVision from '@/assets/icons/icon-vision.svg';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const FEATURES = [
  { badge: icoDashboard, title: 'Command Center', desc: 'See your entire day at a glance — events, habits, goals, and priorities unified in one dashboard.' },
  { badge: icoJournal, title: 'Daily Journal', desc: 'Capture energy levels, gratitude, wins, and lessons with guided prompts that build self-awareness.' },
  { badge: icoGoals, title: 'Goal Tracking', desc: 'Break ambitious goals into milestones. Track progress with visual indicators and celebrate wins.' },
  { badge: icoHabits, title: 'Habit Streaks', desc: 'Build unbreakable routines with streak tracking, completion rates, and motivational momentum.' },
  { badge: icoSystems, title: 'Life Systems', desc: 'Design repeatable systems for every area of life — health, career, learning, and relationships.' },
  { badge: icoAnalytics, title: 'Deep Analytics', desc: 'Understand your patterns with beautiful charts — energy trends, habit consistency, and focus time.' },
  { badge: icoMorning, title: 'Morning Briefing', desc: 'Start each day with a personalized briefing — weather, schedule, priorities, and affirmations.' },
  { badge: icoReview, title: 'Weekly Review', desc: 'Reflect on your week with structured reviews that compound into transformative self-knowledge.' },
  { badge: icoVision, title: 'Vision Board', desc: 'Visualize your ideal future across career, health, finance, and personal growth categories.' },
];

const STATS = [
  { value: '10+', label: 'Productivity tools', badge: icoLightning },
  { value: '∞', label: 'Custom systems', badge: icoSystems },
  { value: '365', label: 'Days of journaling', badge: icoFire },
  { value: '100%', label: 'Privacy first', badge: icoTarget },
];

const TESTIMONIALS = [
  { quote: 'This replaced 5 different apps for me. Everything I need is in one beautiful interface.', name: 'Sarah K.', role: 'Product Designer', stars: 5 },
  { quote: 'The morning briefing alone changed how I start my day. I feel 10x more intentional.', name: 'Marcus T.', role: 'Startup Founder', stars: 5 },
  { quote: 'Finally a system that adapts to me, not the other way around. Absolutely love the vision board.', name: 'Priya S.', role: 'Engineering Manager', stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      <CursorSparkle />
      <FloatingOrbs />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/welcome" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="DayBlock" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-semibold tracking-tight">DayBlock</span>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full px-5 font-medium">
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* HERO + LOGIN */}
      <HeroLoginSection />

      {/* STATS */}
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

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Everything you need.<br /><span className="text-white/40">Nothing you don't.</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">Nine powerful modules that work together seamlessly — so you can focus on what matters.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
              >
                <GlowCard className="rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
                  <div className="p-6">
                    <img src={f.badge} alt="" width={48} height={48} className="rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-white/[0.015] relative">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How it works
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', badge: icoSparkle, title: 'Set Up Your Systems', desc: 'Define the areas of your life — career, health, finance, learning — and create repeatable systems for each.' },
              { step: '02', badge: icoFire, title: 'Build Daily Rituals', desc: 'Use morning briefings, journals, and habit tracking to stay consistent every single day.' },
              { step: '03', badge: icoTrophy, title: 'Review & Evolve', desc: 'Weekly reviews and analytics reveal your patterns, so you continuously optimize and grow.' },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <span className="text-6xl font-bold text-white/[0.06] block mb-4">{s.step}</span>
                <motion.img
                  src={s.badge}
                  alt=""
                  width={56}
                  height={56}
                  className="rounded-2xl mx-auto mb-4"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">Loved by builders</h2>
            <p className="text-center text-white/40 mb-14">People who take their growth seriously.</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <GlowCard className="rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="p-6">
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
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-6 bg-white/[0.015] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0071e3]/5 via-transparent to-transparent pointer-events-none" />
        <motion.div
          className="relative max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.img
            src={icoStar}
            alt=""
            width={56}
            height={56}
            className="rounded-2xl mx-auto mb-6"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">
            Ready to transform
            <br />
            <span className="bg-gradient-to-r from-[#0071e3] to-[#5AC8FA] bg-clip-text text-transparent">your daily routine?</span>
          </h2>
          <p className="text-lg text-white/45 mb-10 leading-relaxed max-w-lg mx-auto">
            Stop juggling five different apps. One system, one dashboard, one place to become the best version of yourself.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full px-10 h-12 text-base font-medium gap-2 hover:shadow-[0_0_30px_rgba(0,113,227,0.4)] transition-shadow duration-300">
              Start your journey <ArrowRight className="h-4 w-4" weight="bold" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <img src={icoCalendar} alt="" width={20} height={20} className="rounded opacity-50" />
            <span>© 2026 System Calendar. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <Link to="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link to="/cookies" className="hover:text-white/60 transition-colors">Cookies</Link>
            <Link to="/welcome" className="hover:text-white/60 transition-colors">Sign in</Link>
            <Link to="/signup" className="hover:text-white/60 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

      {/* Float keyframes */}
      <style>{`
        ${Array.from({ length: 8 }).map((_, i) => `
          @keyframes float-${i} {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(${-8 - (i % 3) * 4}px); }
          }
        `).join('')}
      `}</style>
    </div>
  );
}
