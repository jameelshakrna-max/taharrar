'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Trophy, Shield, LogOut, ChevronLeft, ChevronRight,
  Calendar, Star, Heart, Sparkles, ArrowLeftRight,
  Home, BarChart3, Award, Settings, Snowflake, Target,
  Bell, X, Check, Lock, TrendingUp, Users,
  Save, Plus, Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────
interface UserData {
  id: string;
  email: string;
  name: string | null;
  streakDays: number;
  bestStreak: number;
  goalStreak: number;
  streakFreezesLeft: number;
  freezeUsedThisWeek: boolean;
}

interface CheckIn {
  id: string;
  date: string;
  relapsed: boolean;
  mood: number | null;
  note: string | null;
}

interface StatsData {
  user: UserData;
  todayCheckedIn: boolean;
  todayRelapsed: boolean;
  todayMood: number | null;
  todayNote: string | null;
  recentCheckIns: CheckIn[];
  totalCheckIns: number;
  cleanDays: number;
  relapsedDays: number;
  weeklyStats: { weekLabel: string; checkIns: number; clean: number; relapsed: number }[];
  monthlyStats: { monthLabel: string; checkIns: number; clean: number; relapsed: number }[];
  relapseByDay: { day: string; count: number }[];
  journalCount: number;
}

type TabId = 'home' | 'calendar' | 'stats' | 'achievements' | 'settings';

// ─── Constants ────────────────────────────────────────────────────
const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
const moodLabels = ['سيء جداً', 'سيء', 'عادي', 'جيد', 'ممتاز'];

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
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
} as const;

const arabicDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const achievements = [
  { id: 'first_day', title: 'البداية', description: 'أول يوم نظيف', icon: Sparkles, threshold: 1, color: 'from-blue-500 to-cyan-500' },
  { id: 'three_days', title: 'خطوات أولى', description: '3 أيام متتالية', icon: TrendingUp, threshold: 3, color: 'from-emerald-500 to-green-500' },
  { id: 'week_clean', title: 'أسبوع من الحرية', description: '7 أيام متتالية', icon: Shield, threshold: 7, color: 'from-emerald-500 to-teal-500' },
  { id: 'two_weeks', title: 'نصف شهر', description: '14 يوماً متتالياً', icon: Star, threshold: 14, color: 'from-amber-500 to-yellow-500' },
  { id: 'month_clean', title: 'شهر كامل', description: '30 يوماً متتالياً', icon: Trophy, threshold: 30, color: 'from-orange-500 to-amber-500' },
  { id: 'two_months', title: 'شهران', description: '60 يوماً متتالياً', icon: Flame, threshold: 60, color: 'from-red-500 to-orange-500' },
  { id: 'quarter_year', title: 'ربع سنة', description: '90 يوماً متتالياً', icon: Award, threshold: 90, color: 'from-purple-500 to-pink-500' },
  { id: 'half_year', title: 'نصف سنة', description: '180 يوماً متتالياً', icon: Heart, threshold: 180, color: 'from-rose-500 to-red-500' },
  { id: 'full_year', title: 'سنة كاملة', description: '365 يوماً متتالياً', icon: Trophy, threshold: 365, color: 'from-yellow-400 to-amber-500' },
];

// ─── Helper Functions ─────────────────────────────────────────────
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'اليوم';
  if (date.toDateString() === yesterday.toDateString()) return 'أمس';
  return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDayKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
                    <h3 className="text-lg font-bold text-white">أدخل بريدك الإلكتروني</h3>
                    <p className="text-xs text-gray-400">سنرسل لك رمز تحقق مكون من 6 أرقام</p>
                  </div>
                  <Input type="email" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 text-right text-base" dir="ltr" />
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/25">
                    {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white">أدخل رمز الـ 6 أرقام</h3>
                    <p className="text-xs text-gray-400" dir="ltr">تم الإرسال إلى {email}</p>
                  </div>
                  <Input maxLength={6} type="text" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="h-16 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 text-center text-3xl tracking-[0.5em] font-mono" dir="ltr" />
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={loading || otpCode.length !== 6} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/25">
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

// ─── Home Tab ────────────────────────────────────────────────────
function HomeTab({
  stats, checkinLoading, message, messageType, checkinMood, setCheckinMood, checkinNote, setCheckinNote, onCheckIn,
}: {
  stats: StatsData; checkinLoading: boolean; message: string; messageType: 'success' | 'relapse' | '';
  checkinMood: number; setCheckinMood: (v: number) => void; checkinNote: string; setCheckinNote: (v: string) => void;
  onCheckIn: (relapsed: boolean) => void;
}) {
  if (!stats) return null;
  const { user, todayCheckedIn, todayRelapsed, recentCheckIns, totalCheckIns } = stats;
  const goalPercent = user.goalStreak > 0 ? Math.min((user.streakDays / user.goalStreak) * 100, 100) : 0;
  const todayBadgeClass = todayRelapsed
    ? 'border-orange-500/50 text-orange-400 bg-orange-500/10'
    : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
  const todayBadgeText = todayRelapsed ? 'سجل انتكاس' : ' ✨ يوم نظيف';

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Streak Counter */}
      <motion.div variants={scaleIn}>
        <Card className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl border-emerald-800/30 overflow-hidden">
          <CardContent className="p-6 text-center relative">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-400" /></div>
            <p className="text-xs text-gray-400">أفضل سلسلة</p>
            <p className="text-lg font-bold text-white">{user.bestStreak}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Star className="w-4 h-4 text-emerald-400" /></div>
            <p className="text-xs text-gray-400">التسجيلات</p>
            <p className="text-lg font-bold text-white">{totalCheckIns}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center"><Snowflake className="w-4 h-4 text-sky-400" /></div>
            <p className="text-xs text-gray-400">التجميد</p>
            <p className="text-lg font-bold text-white">{user.streakFreezesLeft}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div key={message} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.3 }}>
            <Card className={`border ${messageType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
              <CardContent className="p-4 text-center">
                <p className={`text-sm font-medium ${messageType === 'success' ? 'text-emerald-300' : 'text-orange-300'}`}>{message}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-1">هل مارست العادة اليوم؟</h3>
              <p className="text-xs text-gray-400">كن صادقًا مع نفسك</p>
            </div>

            {!todayCheckedIn ? (
              <motion.div className="space-y-4" initial="hidden" animate="visible" variants={containerVariants}>
                <motion.div variants={itemVariants}>
                  <p className="text-xs text-gray-400 text-center mb-2">كيف تشعر اليوم؟</p>
                  <div className="flex items-center justify-center gap-3">
                    {moodEmojis.map((emoji, i) => {
                      const isSelected = checkinMood === i + 1;
                      const moodBtnClass = isSelected
                        ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110'
                        : 'hover:bg-gray-800/50';
                      return (
                        <button key={i} onClick={() => setCheckinMood(i + 1)} className={`text-2xl p-2 rounded-xl transition-all duration-200 ${moodBtnClass}`}>
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                  {checkinMood > 0 && <p className="text-xs text-emerald-400 text-center mt-1">{moodLabels[checkinMood - 1]}</p>}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Textarea placeholder="ملاحظة يومية (اختياري)..." value={checkinNote} onChange={(e) => setCheckinNote(e.target.value)} className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 text-right text-sm min-h-[60px]" rows={2} />
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                  <Button onClick={() => onCheckIn(false)} disabled={checkinLoading} className="w-full h-14 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-base">
                    <div className="flex items-center gap-2"><Shield className="w-5 h-5" /><span>لا، لم أمارسها</span></div>
                  </Button>
                  <Button onClick={() => onCheckIn(true)} disabled={checkinLoading} className="w-full h-14 bg-gradient-to-l from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 text-base">
                    <div className="flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" /><span>نعم</span></div>
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">لقد قمت بتسجيل يومك اليوم</span>
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className={todayBadgeClass}>{todayBadgeText}</Badge>
                </div>
                {stats.todayNote && <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{stats.todayNote}</p>}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* History */}
      {recentCheckIns.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />السجل الأخير</h3>
                <span className="text-xs text-gray-500">{recentCheckIns.length} تسجيل</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recentCheckIns.map((checkIn, index) => {
                  const bgClass = checkIn.relapsed ? 'bg-red-500/10' : 'bg-emerald-500/10';
                  const badgeClass = checkIn.relapsed
                    ? 'border-red-500/30 text-red-400 bg-red-500/5'
                    : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
                  const badgeText = checkIn.relapsed ? 'انتكاس' : 'نظيف';
                  const iconEl = checkIn.relapsed
                    ? <ArrowLeftRight className="w-4 h-4 text-red-400" />
                    : <Shield className="w-4 h-4 text-emerald-400" />;
                  return (
                    <motion.div key={checkIn.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass}`}>{iconEl}</div>
                        <p className="text-sm text-white">{formatDate(checkIn.date)}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${badgeClass}`}>{badgeText}</Badge>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Calendar Tab ────────────────────────────────────────────────
function CalendarTab({ stats }: { stats: StatsData }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthCheckIns, setMonthCheckIns] = useState<CheckIn[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const { user } = stats;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchCalendar = async () => {
      setCalLoading(true);
      try {
        const res = await fetch(`/api/calendar?year=${year}&month=${month + 1}`);
        const data = await res.json();
        setMonthCheckIns(data.checkIns || []);
      } catch (err) {
        console.error('Calendar fetch error:', err);
      } finally {
        setCalLoading(false);
      }
    };
    fetchCalendar();
  }, [year, month]);

  // Build map of day -> checkIn
  const checkInMap: Record<string, CheckIn> = {};
  monthCheckIns.forEach((ci) => {
    checkInMap[getDayKey(ci.date)] = ci;
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Saturday-start offset: (getDay()+1)%7
  const startOffset = (firstDay.getDay() + 1) % 7;
  const today = new Date();
  const todayKey = getDayKey(today.toISOString());

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells: React.ReactNode[] = [];
  // Empty cells before month starts
  for (let i = 0; i < startOffset; i++) {
    cells.push(<div key={`empty-${i}`} className="h-10" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ci = checkInMap[dateKey];
    const isToday = dateKey === todayKey;
    const dayNumClass = isToday ? 'bg-emerald-500 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-300';
    let dotColor = 'bg-gray-700';
    let borderColor = 'border-gray-800/50';
    if (ci) {
      if (ci.relapsed) { dotColor = 'bg-red-500'; borderColor = 'border-red-500/20'; }
      else { dotColor = 'bg-emerald-500'; borderColor = 'border-emerald-500/20'; }
    }
    cells.push(
      <div key={day} className={`h-10 flex flex-col items-center justify-center rounded-lg border ${borderColor} hover:bg-gray-800/30 transition-colors`}>
        <div className={dayNumClass}>
          <span className="text-xs">{day}</span>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-0.5`} />
      </div>
    );
  }

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Month Header */}
      <motion.div variants={scaleIn}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-white">{arabicMonths[month]} {year}</h3>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {arabicDays.map((d) => (
                <div key={d} className="text-center text-[10px] text-gray-500 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            {calLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">{cells}</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-400">يوم نظيف</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-gray-400">انتكاس</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-700" />
                <span className="text-xs text-gray-400">لم يسجل</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Streak Info */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">السلسلة الحالية</p>
                <p className="text-xl font-bold text-white">{user.streakDays} يوم</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────
function StatsTab({ stats }: { stats: StatsData }) {
  const { user, totalCheckIns, cleanDays, relapsedDays } = stats;
  const cleanRate = totalCheckIns > 0 ? Math.round((cleanDays / totalCheckIns) * 100) : 0;

  // Compute last 7 days stats from recentCheckIns
  const last7Days: { label: string; clean: number; relapsed: number; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = getDayKey(d.toISOString());
    const dayLabel = d.toLocaleDateString('ar-SA', { weekday: 'short' });
    const dayCheckIns = stats.recentCheckIns.filter((ci) => getDayKey(ci.date) === dayKey);
    const clean = dayCheckIns.filter((ci) => !ci.relapsed).length;
    const relapsed = dayCheckIns.filter((ci) => ci.relapsed).length;
    last7Days.push({ label: dayLabel, clean, relapsed, total: clean + relapsed });
  }
  const maxDayTotal = Math.max(...last7Days.map((d) => d.total), 1);

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Overview Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Shield className="w-4 h-4 text-emerald-400" /></div>
            <p className="text-xs text-gray-400">أيام نظيفة</p>
            <p className="text-xl font-bold text-emerald-400">{cleanDays}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><ArrowLeftRight className="w-4 h-4 text-red-400" /></div>
            <p className="text-xs text-gray-400">أيام انتكاس</p>
            <p className="text-xl font-bold text-red-400">{relapsedDays}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-400" /></div>
            <p className="text-xs text-gray-400">إجمالي التسجيلات</p>
            <p className="text-xl font-bold text-blue-400">{totalCheckIns}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-amber-400" /></div>
            <p className="text-xs text-gray-400">نسبة النظافة</p>
            <p className="text-xl font-bold text-amber-400">{cleanRate}%</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clean Rate Progress */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">نسبة الأيام النظيفة</h3>
              <span className="text-sm text-emerald-400 font-bold">{cleanRate}%</span>
            </div>
            <Progress value={cleanRate} className="h-3 bg-gray-800" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{cleanDays} يوم نظيف</span>
              <span className="text-xs text-gray-500">{relapsedDays} يوم انتكاس</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Last 7 Days Chart */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-white mb-4">آخر 7 أيام</h3>
            <div className="flex items-end gap-2 h-32">
              {last7Days.map((day, i) => {
                const barHeight = day.total > 0 ? Math.max((day.total / maxDayTotal) * 100, 12) : 6;
                const barColor = day.relapsed > day.clean ? 'bg-red-500' : 'bg-emerald-500';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full ${barColor} rounded-t transition-all duration-300`} style={{ height: `${barHeight}%` }} />
                    <span className="text-[9px] text-gray-500 truncate w-full text-center">{day.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-gray-500">نظيف</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] text-gray-500">انتكاس</span></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak Summary */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-white mb-4">ملخص السلسلة</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /><span className="text-sm text-gray-400">السلسلة الحالية</span></div>
                <span className="font-bold text-white">{user.streakDays} يوم</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /><span className="text-sm text-gray-400">أفضل سلسلة</span></div>
                <span className="font-bold text-white">{user.bestStreak} يوم</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /><span className="text-sm text-gray-400">الهدف</span></div>
                <span className="font-bold text-white">{user.goalStreak} يوم</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ─── Achievements Tab ────────────────────────────────────────────
function AchievementsTab({ stats }: { stats: StatsData }) {
  const { user } = stats;

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={scaleIn}>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 backdrop-blur-xl border-amber-800/30">
          <CardContent className="p-5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-3 shadow-lg shadow-amber-500/20">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">الإنجازات</h3>
            <p className="text-sm text-gray-400">
              تم فتح {achievements.filter((a) => user.bestStreak >= a.threshold).length} من {achievements.length}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievement List */}
      <motion.div variants={itemVariants} className="space-y-2">
        {achievements.map((ach) => {
          const unlocked = user.bestStreak >= ach.threshold;
          const Icon = ach.icon;
          const cardClass = unlocked
            ? 'bg-gray-900/60 border-gray-800/50'
            : 'bg-gray-900/30 border-gray-800/30 opacity-60';
          const iconBgClass = unlocked
            ? `bg-gradient-to-br ${ach.color}`
            : 'bg-gray-800';
          const statusText = unlocked
            ? <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />مفتوح</span>
            : <span className="text-xs text-gray-500 flex items-center gap-1"><Lock className="w-3 h-3" />{ach.threshold} يوم</span>;
          return (
            <motion.div key={ach.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
              <Card className={cardClass}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${iconBgClass} flex items-center justify-center shadow-lg`}>
                      <Icon className={`w-5 h-5 ${unlocked ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-gray-500'}`}>{ach.title}</p>
                      <p className="text-xs text-gray-500">{ach.description}</p>
                    </div>
                    {statusText}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────
function SettingsTab({ stats, onUpdate }: { stats: StatsData; onUpdate: () => void }) {
  const { user } = stats;
  const [name, setName] = useState(user.name || '');
  const [goalStreak, setGoalStreak] = useState(user.goalStreak);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || null, goalStreak }),
      });
      const data = await res.json();
      if (data.user) {
        setSaveMsg('تم الحفظ بنجاح ✅');
        onUpdate();
      } else {
        setSaveMsg('حدث خطأ في الحفظ');
      }
    } catch {
      setSaveMsg('حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Profile */}
      <motion.div variants={scaleIn}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />الملف الشخصي</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">الاسم</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسمك" className="h-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 text-right text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">البريد الإلكتروني</label>
                <Input value={user.email} disabled className="h-10 bg-gray-800/30 border-gray-700 text-gray-500 text-sm" dir="ltr" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Goal Streak */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" />هدف السلسلة</h3>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setGoalStreak(Math.max(1, goalStreak - 1))} className="w-10 h-10 rounded-xl bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-4xl font-black text-emerald-400">{goalStreak}</p>
                <p className="text-xs text-gray-500">يوم</p>
              </div>
              <button onClick={() => setGoalStreak(goalStreak + 1)} className="w-10 h-10 rounded-xl bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[7, 30, 90, 365].map((val) => {
                const btnClass = goalStreak === val
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-gray-800/30 border-gray-700 text-gray-500';
                return (
                  <button key={val} onClick={() => setGoalStreak(val)} className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${btnClass}`}>
                    {val} يوم
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak Freeze Info */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Snowflake className="w-4 h-4 text-sky-400" />تجميد السلسلة</h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30">
              <div>
                <p className="text-sm text-white">التجميدات المتاحة</p>
                <p className="text-xs text-gray-500">يتم تجديد واحدة أسبوعياً</p>
              </div>
              <span className="text-xl font-bold text-sky-400">{user.streakFreezesLeft}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={itemVariants}>
        {saveMsg && (
          <p className={`text-sm text-center mb-2 ${saveMsg.includes('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</p>
        )}
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </div>
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Bottom Tab Navigation ───────────────────────────────────────
function BottomNav({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }) {
  const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'calendar', label: 'التقويم', icon: Calendar },
    { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
    { id: 'achievements', label: 'الإنجازات', icon: Award },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800/50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const tabClass = isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400';
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200 min-w-[56px] ${tabClass}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && <motion.div layoutId="tab-indicator" className="w-1 h-1 rounded-full bg-emerald-400" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Dashboard Screen ──────────────────────────────────────────────
function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'relapse' | ''>('');
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [checkinMood, setCheckinMood] = useState(0);
  const [checkinNote, setCheckinNote] = useState('');
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.user) setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchStats();
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchStats();
      else { setStats(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [fetchStats]);

  const handleCheckIn = async (relapsed: boolean) => {
    setCheckinLoading(true);
    try {
      const body: Record<string, unknown> = {
        relapsed,
        mood: checkinMood > 0 ? checkinMood : null,
        note: checkinNote.trim() || null,
      };
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        setMessageType('relapse');
        return;
      }
      const msg = relapsed
        ? 'لا بأس، الطريق ليس سهلاً. المهم أنك لا تستسلم!'
        : 'أنت أقوى مما تتصور! استمر!';
      setMessage(msg);
      setMessageType(relapsed ? 'relapse' : 'success');
      setCheckinMood(0);
      setCheckinNote('');
      fetchStats();
    } catch {
      setMessage('حدث خطأ. حاول مرة أخرى.');
      setMessageType('relapse');
    } finally {
      setCheckinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

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
              <p className="text-[10px] text-gray-400">Logged in securely</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-400 hover:text-white hover:bg-gray-800/50">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <HomeTab stats={stats} checkinLoading={checkinLoading} message={message} messageType={messageType} checkinMood={checkinMood} setCheckinMood={setCheckinMood} checkinNote={checkinNote} setCheckinNote={setCheckinNote} onCheckIn={handleCheckIn} />
            </motion.div>
          )}
          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <CalendarTab stats={stats} />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <StatsTab stats={stats} />
            </motion.div>
          )}
          {activeTab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AchievementsTab stats={stats} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <SettingsTab stats={stats} onUpdate={fetchStats} />
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function TaharrurPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <DashboardScreen
      onLogout={() => {
        supabase.auth.signOut();
        setSession(null);
      }}
    />
  );
}
