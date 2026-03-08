import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';

import icoSparkle from '@/assets/icons/icon-sparkle.svg';
import icoCalendar from '@/assets/icons/icon-calendar.svg';
import icoDashboard from '@/assets/icons/icon-dashboard.svg';
import icoJournal from '@/assets/icons/icon-journal.svg';
import icoGoals from '@/assets/icons/icon-goals.svg';
import icoHabits from '@/assets/icons/icon-habits.svg';
import icoSystems from '@/assets/icons/icon-systems.svg';
import icoAnalytics from '@/assets/icons/icon-analytics.svg';
import icoMorning from '@/assets/icons/icon-morning.svg';
import icoReview from '@/assets/icons/icon-review.svg';
import icoVision from '@/assets/icons/icon-vision.svg';

export default function HeroLoginSection() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const orbitIcons = [icoJournal, icoGoals, icoHabits, icoSystems, icoAnalytics, icoMorning, icoReview, icoVision];

  return (
    <section className="relative pt-28 pb-16 px-6">
      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-[#0071e3]/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1fr,420px] gap-12 lg:gap-16 items-center">
        {/* Left — Hero copy */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-sm text-white/60 mb-8">
            <img src={icoSparkle} alt="" width={18} height={18} />
            <span>Your entire life, systematized</span>
          </div>

          <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            The operating system
            <br />
            <span className="bg-gradient-to-r from-[#0071e3] via-[#5AC8FA] to-[#BF5AF2] bg-clip-text text-transparent">
              for your life.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
            Journals, goals, habits, systems, vision boards, and analytics —
            unified in one beautiful dark interface designed to help you become unstoppable.
          </p>

          {/* Floating icon orbit — desktop only */}
          <div className="relative h-[200px] hidden lg:block">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[420px] h-[420px]">
              {orbitIcons.map((ico, i) => {
                const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
                const rx = 180, ry = 90;
                const x = 210 + rx * Math.cos(angle);
                const y = 210 + ry * Math.sin(angle);
                return (
                  <img
                    key={i}
                    src={ico}
                    alt=""
                    width={44}
                    height={44}
                    className="absolute rounded-xl shadow-2xl shadow-black/60 transition-transform duration-500 hover:scale-125"
                    style={{
                      left: x - 22,
                      top: y - 22,
                      animation: `float-${i} 6s ease-in-out infinite`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  />
                );
              })}
              <img
                src={icoDashboard}
                alt=""
                width={60}
                height={60}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[18px] shadow-2xl shadow-[#0071e3]/30"
              />
            </div>
          </div>
        </div>

        {/* Right — Login card */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0">
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <img src={icoCalendar} alt="" width={32} height={32} className="rounded-lg" />
              <span className="text-lg font-semibold tracking-tight text-white">Sign in</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-email" className="text-white/60 text-sm">Email</Label>
                <Input
                  id="hero-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="bg-white/[0.06] border-white/[0.10] text-white placeholder:text-white/30 focus:border-[#0071e3] focus:ring-[#0071e3]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-password" className="text-white/60 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="hero-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="bg-white/[0.06] border-white/[0.10] text-white placeholder:text-white/30 focus:border-[#0071e3] focus:ring-[#0071e3]/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl h-11 font-medium"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>

              <div className="flex items-center justify-between text-sm pt-1">
                <Link to="/forgot-password" className="text-white/40 hover:text-white/70 transition-colors">
                  Forgot password?
                </Link>
                <Link to="/signup" className="text-[#5AC8FA] hover:text-[#0071e3] transition-colors font-medium flex items-center gap-1">
                  Create account <ArrowRight className="h-3 w-3" weight="bold" />
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
