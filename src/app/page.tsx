'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Trophy, Shield, LogOut, Calendar, BarChart3, Award, Settings, Star, Snowflake, Sparkles, Mail, KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';

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
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) setError(error.message);
    else setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode,
      type: 'email',
    });
    if (error) setError('رمز التحقق غير صحيح أو منتهي الصلاحية');
    setLoading(false);
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
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="text-center mb-4">
                    <Mail className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-white">أدخل بريدك الإلكتروني</h3>
                    <p className="text-xs text-gray-400">سنرسل لك رمز تحقق مكون من 6 أرقام</p>
                  </div>
                  <Input type="email" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 text-right text-base" dir="ltr" />
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl">
                    {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="text-center mb-4">
                    <KeyRound className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-white">أدخل رمز الـ 6 أرقام</h3>
                    <p className="text-xs text-gray-400" dir="ltr">تم الإرسال إلى {email}</p>
                  </div>
                  <Input maxLength={6} type="text" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="h-16 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 text-center text-3xl tracking-[0.5em] font-mono" dir="ltr" />
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={loading || otpCode.length !== 6} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl">
                    {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                  </Button>
                  <button type="button" onClick={() => { setOtpSent(false); setError(''); }} className="w-full text-xs text-gray-500 hover:text-gray-300">تغيير البريد الإلكتروني</button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Simple Secure Home Tab ─────────────────────────────────────
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchStats();
      else { setStats(null); setLoading(false); }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchStats();
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.user) setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStats(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950">
      <div className="fixed top-0 right-0 w-80 h-80 rounded-full blur-3xl bg-emerald-500/8" />
      <div className="fixed bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-teal-500/8" />
      <div className="relative z-10 max-w-lg mx-auto px-4 pb-24 pt-2">
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
        <SecureHomeTab stats={stats} />
      </div>
    </div>
  );
}