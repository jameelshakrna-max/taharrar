'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Trophy,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Star,
  Heart,
  Sparkles,
  ArrowLeftRight,
  Home,
  BarChart3,
  Award,
  Settings,
  Snowflake,
  Target,
  Sun,
  Moon,
  Bell,
  BookOpen,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Safe localStorage helpers (for Safari private browsing)
const memoryStorage: Record<string, string> = {};
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return memoryStorage[key] || null; }
}
function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { memoryStorage[key] = value; }
}
function safeRemoveItem(key: string): void {
  try { localStorage.removeItem(key); } catch { delete memoryStorage[key]; }
}

// Types
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

interface Achievement {
  type: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface CalendarData {
  checkIns: { id: string; date: string; relapsed: boolean; mood: number | null; note: string | null }[];
  journals: { id: string; date: string; mood: number; note: string }[];
}

type TabId = 'home' | 'calendar' | 'stats' | 'achievements' | 'settings';

// Motivational messages
const successMessages = [
  'أنت أقوى مما تتصور! استمر!',
  'كل يوم هو انتصار جديد. فخرًا بك!',
  'ستصبح أقوى مع كل يوم يمر',
  'طريق الحرية يبدأ بخطوة... وأنت تسيرها!',
  'لا تستسلم، التغيير يحتاج وقتًا',
  'أنت تبني نسخة أفضل من نفسك يومًا بعد يوم',
  'النجاح ليس نهاية المطاف، لكن الاستمرار هو المفتاح',
  'كل يوم تتجاوزه هو دليل على قوتك وإرادتك',
];

const relapseMessages = [
  'لا بأس، الطريق ليس سهلاً. المهم أنك لا تستسلم!',
  'كل بداية جديدة هي فرصة أقوى. ابدأ من جديد!',
  'العثور على نفسك مرة أخرى هو بداية القوة',
  'لا تحكم على نفسك، هذا جزء من الرحلة',
  'أنت لست وحيدك. حاول مرة أخرى!',
  'السقوط ليس الفشل، الاستسلام هو الفشل',
  'رحلة الألف ميل تبدأ بخطوة واحدة',
  'القوة الحقيقية في النهوض بعد السقوط',
];

const dailyQuotes = [
  '"الحرية تبدأ من الداخل"',
  '"كل يوم جديد هو فرصة للتغيير"',
  '"لا تنتظر التحسن، كن أنت التغيير"',
  '"أنت أقوى مما تعتقد"',
  '"الصبر مفتاح الفرج"',
];

const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
const moodLabels = ['سيء جداً', 'سيء', 'عادي', 'جيد', 'ممتاز'];

// Helper functions
function getRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'اليوم';
  if (date.toDateString() === yesterday.toDateString()) return 'أمس';

  return date.toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDayOnly(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function dateToKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getArabicMonth(monthIndex: number): string {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return months[monthIndex];
}

function getArabicDayShort(dayIndex: number): string {
  const days = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  return days[dayIndex];
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
} as const;

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.5, ease: "easeOut" } 
  },
} as const;

// ─── Login Screen ────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dailyQuote, setDailyQuote] = useState(dailyQuotes[0]);
  useEffect(() => {
    setDailyQuote(dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)]);
  }, []);

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
        return;
      }
      safeSetItem('habit-email', email.trim().toLowerCase());
      onLogin(email.trim().toLowerCase());
    } catch {
      setError('حدث خطأ في الاتصال. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={scaleIn} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/25">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-3">
            رحلتي للتحرر
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            تتبع تقدمك نحو حياة أفضل
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-500/70 text-sm">
            <Sparkles className="w-4 h-4" />
            <p>{dailyQuote}</p>
            <Sparkles className="w-4 h-4" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800/50 shadow-2xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="taharrur-email"
                    className="text-sm font-medium text-gray-300 block"
                  >
                    البريد الإلكتروني
                  </label>
                  <Input
                    id="taharrur-email"
                    type="email"
                    placeholder="أدخل بريدك الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 text-right text-base"
                    dir="ltr"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    'ابدأ الآن'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-6 text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500/50" />
              <span>تتبع يومي</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500/50" />
              <span>عد الأيام</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500/50" />
              <span>رسائل تحفيزية</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Home Tab ────────────────────────────────────────────────────
function HomeTab({
  stats,
  loading,
  checkinLoading,
  message,
  messageType,
  checkinMood,
  setCheckinMood,
  checkinNote,
  setCheckinNote,
  onCheckIn,
  onUseFreeze,
}: {
  stats: StatsData;
  loading: boolean;
  checkinLoading: boolean;
  message: string;
  messageType: 'success' | 'relapse' | '';
  checkinMood: number;
  setCheckinMood: (v: number) => void;
  checkinNote: string;
  setCheckinNote: (v: string) => void;
  onCheckIn: (relapsed: boolean) => void;
  onUseFreeze: () => void;
}) {
  if (loading) return null;
  const { user, todayCheckedIn, todayRelapsed, recentCheckIns, totalCheckIns } = stats;
  const goalPercent = user.goalStreak > 0
    ? Math.min((user.streakDays / user.goalStreak) * 100, 100)
    : 0;
  const freezeAvailable = user.streakFreezesLeft > 0 && !user.freezeUsedThisWeek;

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Streak Counter Card */}
      <motion.div variants={scaleIn}>
        <Card className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl border-emerald-800/30 overflow-hidden">
          <CardContent className="p-6 text-center relative">
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full translate-x-1/2 translate-y-1/2" />

            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-emerald-300 text-sm font-medium">يوم متتالي بدون العادة</span>
              </div>

              <motion.div
                key={user.streakDays}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-7xl font-black bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent mb-1"
              >
                {user.streakDays}
              </motion.div>

              <p className="text-gray-400 text-sm mb-3">أيام من الحرية</p>

              {/* Goal Progress */}
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

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-gray-400">أفضل سلسلة</p>
            <p className="text-lg font-bold text-white">{user.bestStreak}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-gray-400">التسجيلات</p>
            <p className="text-lg font-bold text-white">{totalCheckIns}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Snowflake className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xs text-gray-400">التجميد</p>
            <p className="text-lg font-bold text-white">{freezeAvailable ? '1' : '0'}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak Freeze Button */}
      {freezeAvailable && !todayCheckedIn && (
        <motion.div variants={itemVariants}>
          <Button
            onClick={onUseFreeze}
            className="w-full h-11 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium rounded-xl transition-all duration-300"
            variant="outline"
          >
            <Snowflake className="w-4 h-4 ml-2" />
            تفعيل تجميد السلسلة (حماية من الانتكاس)
          </Button>
        </motion.div>
      )}

      {/* Motivational Message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`border ${messageType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
              <CardContent className="p-4 text-center">
                <p className={`text-sm font-medium ${messageType === 'success' ? 'text-emerald-300' : 'text-orange-300'}`}>
                  {message}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-1">هل مارست العادة اليوم؟</h3>
              <p className="text-xs text-gray-400">كن صادقًا مع نفسك</p>
            </div>

            {!todayCheckedIn ? (
              <motion.div className="space-y-4" initial="hidden" animate="visible" variants={containerVariants}>
                {/* Mood Selector */}
                <motion.div variants={itemVariants}>
                  <p className="text-xs text-gray-400 text-center mb-2">كيف تشعر اليوم؟</p>
                  <div className="flex items-center justify-center gap-3">
                    {moodEmojis.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => setCheckinMood(i + 1)}
                        className={`text-2xl p-2 rounded-xl transition-all duration-200 ${checkinMood === i + 1 ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110' : 'hover:bg-gray-800/50'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {checkinMood > 0 && (
                    <p className="text-xs text-emerald-400 text-center mt-1">{moodLabels[checkinMood - 1]}</p>
                  )}
                </motion.div>

                {/* Note */}
                <motion.div variants={itemVariants}>
                  <Textarea
                    placeholder="ملاحظة يومية (اختياري)..."
                    value={checkinNote}
                    onChange={(e) => setCheckinNote(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 text-right text-sm min-h-[60px]"
                    rows={2}
                  />
                </motion.div>

                {/* Buttons */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => onCheckIn(false)}
                    disabled={checkinLoading}
                    className="w-full h-14 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 text-base"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      <span>لا، لم أمارسها</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => onCheckIn(true)}
                    disabled={checkinLoading}
                    className="w-full h-14 bg-gradient-to-l from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all duration-300 text-base"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-5 h-5" />
                      <span>نعم</span>
                    </div>
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-3"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">لقد قمت بتسجيل يومك اليوم</span>
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className={todayRelapsed ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'}>
                    {todayRelapsed ? 'سجل كانتكاس' : ' ✨ يوم نظيف'}
                  </Badge>
                </div>
                {stats.todayMood && (
                  <p className="text-lg mt-2">{moodEmojis[stats.todayMood - 1]} <span className="text-xs text-gray-400">{moodLabels[stats.todayMood - 1]}</span></p>
                )}
                {stats.todayNote && (
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{stats.todayNote}</p>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* History Section */}
      {recentCheckIns.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  السجل الأخير
                </h3>
                <span className="text-xs text-gray-500">{recentCheckIns.length} تسجيل</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recentCheckIns.map((checkIn, index) => (
                  <motion.div
                    key={checkIn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${checkIn.relapsed ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                        {checkIn.relapsed ? (
                          <ArrowLeftRight className="w-4 h-4 text-red-400" />
                        ) : (
                          <Shield className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white">{formatDate(checkIn.date)}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{formatDayOnly(checkIn.date)}</p>
                          {checkIn.mood && <span className="text-xs">{moodEmojis[checkIn.mood - 1]}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${checkIn.relapsed ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'}`}>
                      {checkIn.relapsed ? 'انتكاس' : 'نظيف'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Calendar Tab ────────────────────────────────────────────────
function CalendarTab({ email }: { email: string }) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'heatmap' | 'monthly'>('heatmap');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<{ date: string; checkIn?: typeof calendarData extends null ? never : NonNullable<typeof calendarData>['checkIns'][number]; journal?: typeof calendarData extends null ? never : NonNullable<typeof calendarData>['journals'][number] } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setCalendarLoading(true);
      try {
        const res = await fetch(`/api/calendar?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setCalendarData(data);
      } catch (e) {
        console.error('Failed to fetch calendar data:', e);
      } finally {
        setCalendarLoading(false);
      }
    }
    fetchData();
  }, [email]);

  if (calendarLoading || !calendarData) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  const checkInMap = new Map<string, (typeof calendarData)['checkIns'][number]>();
  for (const ci of calendarData.checkIns) {
    const key = dateToKey(new Date(ci.date));
    checkInMap.set(key, ci);
  }
  const journalMap = new Map<string, (typeof calendarData)['journals'][number]>();
  for (const j of calendarData.journals) {
    const key = dateToKey(new Date(j.date));
    journalMap.set(key, j);
  }

  // Heatmap: build last 6 months grid
  function renderHeatmap() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const weeks: { date: Date; key: string }[][] = [];
    let currentWeek: { date: Date; key: string }[] = [];

    // Align to Sunday
    const start = new Date(sixMonthsAgo);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = dateToKey(d);
      currentWeek.push({ date: new Date(d), key });
      if (d.getDay() === 6 || d.getTime() === end.getTime()) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Month labels
    const monthLabels: string[] = [];
    let lastMonth = -1;
    for (const week of weeks) {
      if (week.length > 0) {
        const m = week[0].date.getMonth();
        if (m !== lastMonth) {
          monthLabels.push(getArabicMonth(m).substring(0, 3));
          lastMonth = m;
        } else {
          monthLabels.push('');
        }
      } else {
        monthLabels.push('');
      }
    }

    return (
      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="flex gap-[3px] mb-1 px-7">
          {monthLabels.map((label, i) => (
            <div key={i} className="w-[10px] text-[8px] text-gray-500 whitespace-nowrap flex-shrink-0" style={{ minWidth: label ? '20px' : '10px' }}>
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1">
            {['', 'إث', '', 'أرب', '', 'جم', 'سبت'].map((d, i) => (
              <div key={i} className="h-[10px] text-[8px] text-gray-500 flex items-center justify-end w-4">{d}</div>
            ))}
          </div>
          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                const ci = checkInMap.get(day.key);
                const isFuture = day.date > today;
                let bg = 'bg-gray-800';
                if (!isFuture && ci) {
                  bg = ci.relapsed ? 'bg-red-500' : 'bg-emerald-500';
                } else if (isFuture) {
                  bg = 'bg-gray-800/30';
                }
                return (
                  <button
                    key={day.key}
                    onClick={() => {
                      if (!isFuture && day.date >= sixMonthsAgo) {
                        const k = dateToKey(day.date);
                        setSelectedDay({
                          date: k,
                          checkIn: checkInMap.get(k),
                          journal: journalMap.get(k),
                        });
                      }
                    }}
                    className={`w-[10px] h-[10px] rounded-[2px] ${bg} hover:ring-1 hover:ring-white/30 transition-all flex-shrink-0`}
                  />
                );
              })}
              {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-[10px] h-[10px] flex-shrink-0" />
              ))}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 justify-center">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-800" /><span className="text-[10px] text-gray-500">بدون تسجيل</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><span className="text-[10px] text-gray-500">نظيف</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-[10px] text-gray-500">انتكاس</span></div>
        </div>
      </div>
    );
  }

  // Monthly calendar
  function renderMonthlyCalendar() {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 1) % 7; // Monday start
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const dayLabels = ['إث', 'ثلث', 'أربع', 'خميس', 'جمع', 'سبت', 'أحد'];

    return (
      <div>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((p) => ({ ...p, month: p.month === 0 ? 11 : p.month - 1, year: p.month === 0 ? p.year - 1 : p.year }))} className="text-gray-400 hover:text-white">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h3 className="text-base font-bold text-white">{getArabicMonth(currentMonth.month)} {currentMonth.year}</h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((p) => ({ ...p, month: p.month === 11 ? 0 : p.month + 1, year: p.month === 11 ? p.year + 1 : p.year }))} className="text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayLabels.map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="h-12" />;
            }
            const date = new Date(currentMonth.year, currentMonth.month, day);
            const key = dateToKey(date);
            const ci = checkInMap.get(key);
            const jrn = journalMap.get(key);
            const isToday = date.toDateString() === today.toDateString();
            const isFuture = date > today;

            let dotColor = 'bg-gray-700';
            if (!isFuture && ci) {
              dotColor = ci.relapsed ? 'bg-red-500' : 'bg-emerald-500';
            }

            return (
              <button
                key={key}
                onClick={() => !isFuture && setSelectedDay({ date: key, checkIn: ci, journal: jrn })}
                disabled={isFuture}
                className={`h-12 flex flex-col items-center justify-center rounded-lg transition-all ${isToday ? 'ring-1 ring-emerald-500' : ''} ${isFuture ? 'opacity-30' : 'hover:bg-gray-800/50'}`}
              >
                <span className={`text-xs ${isToday ? 'text-emerald-400 font-bold' : 'text-gray-300'}`}>{day}</span>
                <div className={`w-2 h-2 rounded-full mt-0.5 ${dotColor}`} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* View Toggle */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${viewMode === 'heatmap' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400 hover:text-gray-300'}`}
              >
                خريطة الحرارة
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${viewMode === 'monthly' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400 hover:text-gray-300'}`}
              >
                التقويم الشهري
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar Content */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            {viewMode === 'heatmap' ? renderHeatmap() : renderMonthlyCalendar()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Selected Day Detail */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white">{formatDate(selectedDay.date + 'T12:00:00')}</h4>
                  <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                {selectedDay.checkIn ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={selectedDay.checkIn.relapsed ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'}>
                      {selectedDay.checkIn.relapsed ? 'انتكاس' : 'نظيف'}
                    </Badge>
                    {selectedDay.checkIn.mood && (
                      <span className="text-sm">{moodEmojis[selectedDay.checkIn.mood - 1]} {moodLabels[selectedDay.checkIn.mood - 1]}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">لا يوجد تسجيل لهذا اليوم</p>
                )}
                {(selectedDay.journal || selectedDay.checkIn?.note) && (
                  <div className="mt-3 p-3 bg-gray-800/30 rounded-lg">
                    <p className="text-sm text-gray-300">
                      {selectedDay.journal?.note || selectedDay.checkIn?.note}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────
function StatsTab({ stats }: { stats: StatsData }) {
  const maxWeeklyCheckins = Math.max(...stats.weeklyStats.map(w => w.checkIns), 1);
  const maxMonthlyCheckins = Math.max(...stats.monthlyStats.map(m => m.checkIns), 1);
  const maxRelapse = Math.max(...stats.relapseByDay.map(d => d.count), 1);

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-400">إجمالي التسجيلات</p>
            <p className="text-2xl font-bold text-white">{stats.totalCheckIns}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-400">أيام نظيفة</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.cleanDays}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-400">أيام انتكاس</p>
            <p className="text-2xl font-bold text-red-400">{stats.relapsedDays}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-400">أفضل سلسلة</p>
            <p className="text-2xl font-bold text-amber-400">{stats.user.bestStreak}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              الأسبوع الماضي (8 أسابيع)
            </h3>
            <div className="space-y-2">
              {stats.weeklyStats.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-12 text-left flex-shrink-0">{w.weekLabel}</span>
                  <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(w.clean / maxWeeklyCheckins) * 100}%` }} />
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(w.relapsed / maxWeeklyCheckins) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-6 text-left flex-shrink-0">{w.checkIns}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /><span className="text-[10px] text-gray-500">نظيف</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500" /><span className="text-[10px] text-gray-500">انتكاس</span></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Summary */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              الملخص الشهري (6 أشهر)
            </h3>
            <div className="space-y-2">
              {stats.monthlyStats.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-12 text-left flex-shrink-0">{m.monthLabel}</span>
                  <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(m.clean / maxMonthlyCheckins) * 100}%` }} />
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(m.relapsed / maxMonthlyCheckins) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-6 text-left flex-shrink-0">{m.checkIns}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Relapse Pattern */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-400" />
              نمط الانتكاس (حسب اليوم)
            </h3>
            <div className="space-y-1.5">
              {stats.relapseByDay.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-10 text-left flex-shrink-0">{d.day}</span>
                  <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-orange-500 to-red-500 transition-all duration-500 rounded" style={{ width: `${(d.count / maxRelapse) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-4 text-left flex-shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
            {stats.relapseDays === 0 && (
              <p className="text-center text-xs text-emerald-400 mt-2">لا توجد انتكاسات حتى الآن! 🎉</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ─── Achievements Tab ────────────────────────────────────────────
function AchievementsTab({ email }: { email: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/achievements?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setAchievements(data.achievements || []);
      } catch (e) {
        console.error('Failed to fetch achievements:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="text-center">
        <p className="text-gray-400 text-sm">الإنجازات المحققة</p>
        <p className="text-2xl font-bold text-white">{unlockedCount} / {achievements.length}</p>
        <Progress value={(unlockedCount / achievements.length) * 100} className="h-2 bg-gray-800 mt-2 max-w-xs mx-auto" />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        {achievements.map((achievement, i) => (
          <motion.div
            key={achievement.type}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`backdrop-blur-xl ${achievement.unlocked ? 'bg-emerald-900/30 border-emerald-700/30' : 'bg-gray-900/40 border-gray-800/30'}`}>
              <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                <span className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-40'}`}>
                  {achievement.icon}
                </span>
                <p className={`text-xs font-bold ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                  {achievement.name}
                </p>
                <p className="text-[9px] text-gray-500 leading-tight">{achievement.description}</p>
                {achievement.unlocked && achievement.unlockedAt && (
                  <p className="text-[8px] text-emerald-400/70 mt-0.5">
                    {formatDate(achievement.unlockedAt)}
                  </p>
                )}
                {achievement.unlocked ? (
                  <div className="w-full h-0.5 bg-emerald-500 rounded mt-1" />
                ) : (
                  <div className="w-full h-0.5 bg-gray-700 rounded mt-1" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────
function SettingsTab({ email, onThemeChange }: { email: string; onThemeChange: (theme: 'dark' | 'light') => void }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('21:00');
  const [goalStreak, setGoalStreak] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/preferences?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.preferredTheme) {
          setTheme(data.preferredTheme);
          onThemeChange(data.preferredTheme);
        }
        if (typeof data.reminderEnabled === 'boolean') setReminderEnabled(data.reminderEnabled);
        if (data.reminderTime) setReminderTime(data.reminderTime);
        if (data.goalStreak) setGoalStreak(data.goalStreak);
      } catch (e) {
        console.error('Failed to fetch preferences:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [email, onThemeChange]);

  // Reminder timer effect
  useEffect(() => {
    if (reminderTimerRef.current) {
      clearInterval(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }

    if (reminderEnabled && typeof window !== 'undefined') {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      reminderTimerRef.current = setInterval(() => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (currentTime === reminderTime) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('تذكير تحرر 🛡️', {
              body: 'لا تنسَ تسجيل يومك! هل مارست العادة اليوم؟',
              icon: '/favicon.ico',
            });
          }
        }
      }, 60000);
    }

    return () => {
      if (reminderTimerRef.current) clearInterval(reminderTimerRef.current);
    };
  }, [reminderEnabled, reminderTime]);

  const savePreferences = async (updates: Record<string, unknown>) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...updates }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    onThemeChange(newTheme);
    safeSetItem('taharrur-theme', newTheme);
    savePreferences({ preferredTheme: newTheme });
  };

  const handleReminderToggle = () => {
    const newVal = !reminderEnabled;
    setReminderEnabled(newVal);
    savePreferences({ reminderEnabled: newVal });
  };

  const handleReminderTimeChange = (time: string) => {
    setReminderTime(time);
    savePreferences({ reminderTime: time });
  };

  const handleGoalChange = () => {
    const val = Math.max(1, Math.min(3650, parseInt(String(goalStreak)) || 30));
    setGoalStreak(val);
    savePreferences({ goalStreak: val });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Account */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              الحساب
            </h3>
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <p className="text-xs text-gray-400">البريد الإلكتروني</p>
              <p className="text-sm text-white" dir="ltr">{email}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              المظهر
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-gray-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span className="text-sm text-gray-300">{theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح'}</span>
              </div>
              <button
                onClick={handleThemeToggle}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-emerald-600' : 'bg-amber-500'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-0.5' : '-translate-x-0.5'}`} />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reminder */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-400" />
              التذكير اليومي
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">تفعيل التذكير</span>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={handleReminderToggle}
              />
            </div>
            {reminderEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">وقت التذكير</span>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="w-28 h-9 bg-gray-800/50 border-gray-700 text-white text-center text-sm"
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  سيتم إرسال إشعار في المتصفح لتذكيرك بالتسجيل
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Goal */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              هدف السلسلة
            </h3>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={3650}
                value={goalStreak}
                onChange={(e) => setGoalStreak(parseInt(e.target.value) || 30)}
                className="w-28 h-10 bg-gray-800/50 border-gray-700 text-white text-center text-sm"
              />
              <Button onClick={handleGoalChange} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
            <p className="text-xs text-gray-400">عدد الأيام التي تريد الوصول إليها بدون انتكاس</p>
            {saved && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400">
                ✅ تم الحفظ
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div variants={itemVariants} className="text-center pt-2 pb-4">
        <Separator className="bg-gray-800/50 mb-4" />
        <p className="text-gray-600 text-xs">تحرر - نسخة 2.0</p>
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
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200 min-w-[56px] ${
                isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="w-1 h-1 rounded-full bg-emerald-400"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Dashboard Screen ────────────────────────────────────────────
function DashboardScreen({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'relapse' | ''>('');
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isDark, setIsDark] = useState(true);
  const [checkinMood, setCheckinMood] = useState(0);
  const [checkinNote, setCheckinNote] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.user) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Initialize theme from saved preference
  useEffect(() => {
    const saved = safeGetItem('taharrur-theme');
    if (saved === 'light') {
      setIsDark(false);
    }
  }, []);

  const handleThemeChange = useCallback((theme: 'dark' | 'light') => {
    setIsDark(theme === 'dark');
  }, []);

  const handleCheckIn = async (relapsed: boolean) => {
    setCheckinLoading(true);
    try {
      const body: Record<string, unknown> = { email, relapsed };
      if (checkinMood > 0) body.mood = checkinMood;
      if (checkinNote.trim()) body.note = checkinNote.trim();

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
        ? getRandomMessage(relapseMessages)
        : getRandomMessage(successMessages);

      setMessage(msg);
      setMessageType(relapsed ? 'relapse' : 'success');

      if (data.freezeUsed) {
        setMessage('🧊 تم استخدام تجميد السلسلة! سلسلتك محمية!');
        setMessageType('success');
      }

      // Show achievement notifications
      if (data.newAchievements && data.newAchievements.length > 0) {
        const achievementNames: Record<string, string> = {
          first_checkin: '🌱 البداية',
          streak_3: '⭐ 3 أيام',
          streak_7: '🌟 أسبوع',
          streak_14: '💫 أسبوعان',
          streak_30: '🏆 شهر',
          streak_60: '🥇 شهران',
          streak_90: '👑 3 أشهر',
          streak_100: '💯 100 يوم',
          streak_180: '🔥 نصف عام',
          streak_365: '🎖️ سنة كاملة',
          comeback: '💪 العودة',
          journal_keeper: '📝 كاتب اليوميات',
        };
        for (const a of data.newAchievements) {
          setTimeout(() => {
            setMessage(`🎉 إنجاز جديد: ${achievementNames[a] || a}`);
            setMessageType('success');
          }, 2000);
        }
      }

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

  const handleUseFreeze = async () => {
    try {
      const res = await fetch('/api/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        setMessageType('relapse');
      } else if (data.message) {
        setMessage(data.message);
        setMessageType('success');
      }
      fetchStats();
    } catch {
      setMessage('حدث خطأ. حاول مرة أخرى.');
      setMessageType('relapse');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full"
        />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDark ? '' : 'light-mode'}`}>
      {/* Background */}
      <div className={`fixed inset-0 transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`} />
      <div className={`fixed top-0 right-0 w-80 h-80 rounded-full blur-3xl transition-colors duration-500 ${isDark ? 'bg-emerald-500/8' : 'bg-emerald-500/10'}`} />
      <div className={`fixed bottom-0 left-0 w-96 h-96 rounded-full blur-3xl transition-colors duration-500 ${isDark ? 'bg-teal-500/8' : 'bg-teal-500/10'}`} />

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pb-24 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>رحلتي للتحرر</h2>
              <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`} dir="ltr">{email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className={`${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <HomeTab
                stats={stats}
                loading={loading}
                checkinLoading={checkinLoading}
                message={message}
                messageType={messageType}
                checkinMood={checkinMood}
                setCheckinMood={setCheckinMood}
                checkinNote={checkinNote}
                setCheckinNote={setCheckinNote}
                onCheckIn={handleCheckIn}
                onUseFreeze={handleUseFreeze}
              />
            </motion.div>
          )}
          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <CalendarTab email={email} />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <StatsTab stats={stats} />
            </motion.div>
          )}
          {activeTab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AchievementsTab email={email} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <SettingsTab email={email} onThemeChange={handleThemeChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function TaharrurPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const savedEmail = safeGetItem('habit-email');
    if (savedEmail) {
      setEmail(savedEmail);
      setIsLoggedIn(true);
    }
    setMounted(true);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!isLoggedIn ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginScreen
            onLogin={(loggedEmail) => {
              setEmail(loggedEmail);
              setIsLoggedIn(true);
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardScreen
            email={email}
            onLogout={() => {
              safeRemoveItem('habit-email');
              setIsLoggedIn(false);
              setEmail('');
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}