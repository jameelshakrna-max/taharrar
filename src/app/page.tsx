'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Trophy, Shield, LogOut, Calendar, BarChart3, Award, Settings, Star, Snowflake, Sparkles, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

// ─── Login Screen ────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('يرجى إدخال بريدك الإلكتروني');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEmailSent(true);
      }
    } catch {
      setError('حدث خطأ في الاتصال.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div className="w-full max-w-md relative z-10" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={scaleIn} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/25">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-3">رحلتي للتحرر</h1>
          <p className="text-gray-400 text-lg">تتبع تقدمك نحو حياة أفضل</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800/50 shadow-2xl">
            <CardContent className="p-6">
              {emailSent ? (
                <div className="text-center space-y-4 py-4">
                  <Sparkles className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h2 className="text-xl font-bold text-white">تم إرسال رابط الدخول!</h2>
                  <p className="text-gray-400">تحقق من بريدك الإلكتروني واضغط على الرابط لتسجيل الدخول.</p>
                  <p className="text-xs text-gray-500" dir="ltr">{email}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-300 block">البريد الإلكتروني</label>
                    <Input id="email" type="email" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 text-right text-base" dir="ltr" />
                  </div>
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/25">
                    {loading ? 'جاري الإرسال...' : 'إرسال رابط الدخول'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Secure Home Tab (Stats Only for now) ────────────────────────
function SecureHomeTab({ stats }: { stats: any }) {
  if (!stats) return null;
  const { user, totalCheckIns } = stats;
  const goalPercent = user.goalStreak > 0 ? Math.min((user.streakDays / user.goalStreak) * 100, 100) : 0;

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={scaleIn}>
        <Card className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl border-emerald-800/30 overflow-hidden">
          <CardContent className="p-6 text-center relative">
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-emerald-300 text-sm font-medium">يوم متتالي بدون العادة</span>
              </div>
              <motion.div key={user.streakDays} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-7xl font-black bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent mb-1">
                {user.streakDays}
              </motion.div>
              <p className="text-gray-400 text-sm mb-3">أيام من الحرية</p>
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">التقدم نحو الهدف ({user.goalStreak} يوم)</span>
                  <span className="text-xs text-emerald-400 font-medium">{Math.round(goalPercent)}%</span>
                </div>
                <Progress value={goalPercent} className="h-2.5 bg-gray-800" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-400">أفضل سلسلة</p>
            <p className="text-2xl font-bold text-amber-400">{user.bestStreak}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-400">التسجيلات</p>
            <p className="text-2xl font-bold text-white">{totalCheckIns}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Info Banner */}
      <motion.div variants={itemVariants}>
        <Card className="bg-sky-500/10 border-sky-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-sky-300 text-sm font-medium">🛡️ تم تسجيل الدخول بأمان</p>
            <p className="text-sky-400/70 text-xs mt-1" dir="ltr">Secure Session Active (ID: {user.id.substring(0, 8)}...)</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function TaharrurPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const supabase = createClient();

  // 1. Listen for Auth State Changes (Magic Link Click)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchStats();
    });

    // 2. Get Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchStats();
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Fetch Stats securely (NO EMAIL PARAMETER!)
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats'); // Notice: No ?email=... !
      const data = await res.json();
      if (data.user) setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Secure Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStats(null);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  // Not Logged In -> Show Magic Link Form
  if (!session) {
    return <LoginScreen />;
  }

  // Logged In -> Show Dashboard
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950">
      <div className="fixed top-0 right-0 w-80 h-80 rounded-full blur-3xl bg-emerald-500/8" />
      <div className="fixed bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-teal-500/8" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-24 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">رحلتي للتحرر</h2>
              <p className="text-[10px] text-gray-400" dir="ltr">{session.user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400 hover:text-white hover:bg-gray-800/50">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <SecureHomeTab stats={stats} />
      </div>
    </div>
  );
}