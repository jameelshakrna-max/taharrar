'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Trophy, Shield, LogOut, ChevronLeft, ChevronRight,
  Calendar, Star, Heart, Sparkles, ArrowLeftRight,
  Home, BarChart3, Award, Settings, Snowflake, Target,
  Bell, X, Check, Lock, TrendingUp, Users,
  Save, Plus, Minus, Globe, Medal, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

// ─── i18n Translations ───────────────────────────────────────────
type Lang = 'ar' | 'en';

const t: Record<Lang, Record<string, string>> = {
  ar: {
    appName: 'رحلتي للتحرر',
    appDesc: 'تتبع تقدمك نحو حياة أفضل',
    loginTitle: 'أدخل بريدك الإلكتروني',
    loginSubtitle: 'سنرسل لك رمز تحقق مكون من 6 أرقام',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    sendOtp: 'إرسال رمز التحقق',
    sending: 'جاري الإرسال...',
    enterCode: 'أدخل رمز الـ 6 أرقام',
    sentTo: 'تم الإرسال إلى',
    login: 'تسجيل الدخول',
    verifying: 'جاري التحقق...',
    changeEmail: 'تغيير البريد الإلكتروني',
    invalidOtp: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
    rateLimitError: 'تم تجاوز حد الإرسال. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
    resendOtp: 'إعادة إرسال الرمز',
    resendIn: 'إعادة الإرسال بعد',
    seconds: 'ثانية',
    consecutiveDays: 'يوم متتالي بدون العادة',
    freedomDays: 'أيام من الحرية',
    progressGoal: 'التقدم نحو الهدف',
    day: 'يوم',
    bestStreak: 'أفضل سلسلة',
    checkins: 'التسجيلات',
    freezes: 'التجميد',
    practiceToday: 'هل مارست العادة اليوم؟',
    beHonest: 'كن صادقًا مع نفسك',
    howFeel: 'كيف تشعر اليوم؟',
    dailyNote: 'ملاحظة يومية (اختياري)...',
    noDidNot: 'لا، لم أمارسها',
    yes: 'نعم',
    alreadyChecked: 'لقد قمت بتسجيل يومك اليوم',
    loggedRelapse: 'سجل انتكاس',
    cleanDay: 'يوم نظيف',
    recentLog: 'الجل الأخير',
    records: 'تسجيل',
    relapse: 'انتكاس',
    clean: 'نظيف',
    home: 'الرئيسية',
    calendar: 'التقويم',
    stats: 'الإحصائيات',
    achievements: 'الإنجازات',
    settings: 'الإعدادات',
    leaderboard: 'المتصدرين',
    // Calendar
    cleanDayDot: 'يوم نظيف',
    relapseDot: 'انتكاس',
    notLogged: 'لم يسجل',
    currentStreak: 'السلسلة الحالية',
    // Stats
    cleanDays: 'أيام نظيفة',
    relapseDays: 'أيام انتكاس',
    totalCheckins: 'إجمالي التسجيلات',
    cleanRate: 'نسبة النظافة',
    cleanRateTitle: 'نسبة الأيام النظيفة',
    last7Days: 'آخر 7 أيام',
    streakSummary: 'ملخص السلسلة',
    current: 'السلسلة الحالية',
    best: 'أفضل سلسلة',
    goal: 'الهدف',
    // Achievements
    achievementsTitle: 'الإنجازات',
    unlockedCount: 'تم فتح',
    of: 'من',
    unlocked: 'مفتوح',
    ach_first_day: 'البداية',
    ach_first_day_desc: 'أول يوم نظيف',
    ach_three_days: 'خطوات أولى',
    ach_three_days_desc: '3 أيام متتالية',
    ach_week: 'أسبوع من الحرية',
    ach_week_desc: '7 أيام متتالية',
    ach_two_weeks: 'نصف شهر',
    ach_two_weeks_desc: '14 يوماً متتالياً',
    ach_month: 'شهر كامل',
    ach_month_desc: '30 يوماً متتالياً',
    ach_two_months: 'شهران',
    ach_two_months_desc: '60 يوماً متتالياً',
    ach_quarter: 'ربع سنة',
    ach_quarter_desc: '90 يوماً متتالياً',
    ach_half: 'نصف سنة',
    ach_half_desc: '180 يوماً متتالياً',
    ach_year: 'سنة كاملة',
    ach_year_desc: '365 يوماً متتالياً',
    // Settings
    profile: 'الملف الشخصي',
    name: 'الاسم',
    namePlaceholder: 'أدخل اسمك',
    email: 'البريد الإلكتروني',
    streakGoal: 'هدف السلسلة',
    streakFreeze: 'تجميد السلسلة',
    freezesAvailable: 'التجميدات المتاحة',
    renewedWeekly: 'يتم تجديد واحدة أسبوعياً',
    saveChanges: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ بنجاح',
    saveError: 'حدث خطأ في الحفظ',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    // Leaderboard
    leaderboardTitle: 'لوحة المتصدرين',
    topStreaks: 'أعلى سلسلة حالية',
    topBestStreaks: 'أفضل سلسلة على الإطلاق',
    topCheckins: 'أكثر تسجيلات',
    topCleanDays: 'أكثر أيام نظيفة',
    rank: 'الترتيب',
    noData: 'لا توجد بيانات بعد',
    yourRank: 'ترتيبك',
    notRanked: 'لست في الترتيب بعد',
    loggedInSecurely: 'تم الدخول بأمان',
    // Misc
    today: 'اليوم',
    yesterday: 'أمس',
  },
  en: {
    appName: 'My Freedom Journey',
    appDesc: 'Track your progress towards a better life',
    loginTitle: 'Enter your email',
    loginSubtitle: 'We will send you a 6-digit verification code',
    emailPlaceholder: 'Enter your email',
    sendOtp: 'Send verification code',
    sending: 'Sending...',
    enterCode: 'Enter the 6-digit code',
    sentTo: 'Sent to',
    login: 'Log in',
    verifying: 'Verifying...',
    changeEmail: 'Change email',
    invalidOtp: 'Invalid or expired verification code',
    rateLimitError: 'Rate limit exceeded. Please wait a moment and try again.',
    resendOtp: 'Resend code',
    resendIn: 'Resend in',
    seconds: 'sec',
    consecutiveDays: 'Consecutive days without habit',
    freedomDays: 'Days of freedom',
    progressGoal: 'Progress towards goal',
    day: 'day',
    bestStreak: 'Best streak',
    checkins: 'Check-ins',
    freezes: 'Freezes',
    practiceToday: 'Did you practice the habit today?',
    beHonest: 'Be honest with yourself',
    howFeel: 'How do you feel today?',
    dailyNote: 'Daily note (optional)...',
    noDidNot: 'No, I did not',
    yes: 'Yes',
    alreadyChecked: 'You have already checked in today',
    loggedRelapse: 'Logged relapse',
    cleanDay: 'Clean day',
    recentLog: 'Recent log',
    records: 'records',
    relapse: 'Relapse',
    clean: 'Clean',
    home: 'Home',
    calendar: 'Calendar',
    stats: 'Stats',
    achievements: 'Achievements',
    settings: 'Settings',
    leaderboard: 'Leaderboard',
    cleanDayDot: 'Clean day',
    relapseDot: 'Relapse',
    notLogged: 'Not logged',
    currentStreak: 'Current streak',
    cleanDays: 'Clean days',
    relapseDays: 'Relapse days',
    totalCheckins: 'Total check-ins',
    cleanRate: 'Clean rate',
    cleanRateTitle: 'Clean days rate',
    last7Days: 'Last 7 days',
    streakSummary: 'Streak summary',
    current: 'Current streak',
    best: 'Best streak',
    goal: 'Goal',
    achievementsTitle: 'Achievements',
    unlockedCount: 'Unlocked',
    of: 'of',
    unlocked: 'Unlocked',
    ach_first_day: 'The Beginning',
    ach_first_day_desc: 'First clean day',
    ach_three_days: 'First Steps',
    ach_three_days_desc: '3 consecutive days',
    ach_week: 'Week of Freedom',
    ach_week_desc: '7 consecutive days',
    ach_two_weeks: 'Half Month',
    ach_two_weeks_desc: '14 consecutive days',
    ach_month: 'Full Month',
    ach_month_desc: '30 consecutive days',
    ach_two_months: 'Two Months',
    ach_two_months_desc: '60 consecutive days',
    ach_quarter: 'Quarter Year',
    ach_quarter_desc: '90 consecutive days',
    ach_half: 'Half Year',
    ach_half_desc: '180 consecutive days',
    ach_year: 'Full Year',
    ach_year_desc: '365 consecutive days',
    profile: 'Profile',
    name: 'Name',
    namePlaceholder: 'Enter your name',
    email: 'Email',
    streakGoal: 'Streak goal',
    streakFreeze: 'Streak freeze',
    freezesAvailable: 'Freezes available',
    renewedWeekly: 'Renewed weekly',
    saveChanges: 'Save changes',
    saving: 'Saving...',
    saved: 'Saved successfully',
    saveError: 'Error saving',
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    leaderboardTitle: 'Leaderboard',
    topStreaks: 'Top current streaks',
    topBestStreaks: 'All-time best streaks',
    topCheckins: 'Most check-ins',
    topCleanDays: 'Most clean days',
    rank: 'Rank',
    noData: 'No data yet',
    yourRank: 'Your rank',
    notRanked: 'Not ranked yet',
    loggedInSecurely: 'Logged in securely',
    today: 'Today',
    yesterday: 'Yesterday',
  },
};

// ─── Language Context ────────────────────────────────────────────
const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  tx: (key: string) => string;
}>({ lang: 'ar', setLang: () => {}, tx: (k) => k });

function useLang() { return useContext(LangContext); }

// ─── Types ────────────────────────────────────────────────────────
interface UserData {
  id: string; email: string; name: string | null;
  streakDays: number; bestStreak: number; goalStreak: number;
  streakFreezesLeft: number; freezeUsedThisWeek: boolean;
}

interface CheckIn {
  id: string; date: string; relapsed: boolean;
  mood: number | null; note: string | null;
}

interface StatsData {
  user: UserData; todayCheckedIn: boolean; todayRelapsed: boolean;
  todayMood: number | null; todayNote: string | null;
  recentCheckIns: CheckIn[]; totalCheckIns: number;
  cleanDays: number; relapsedDays: number;
  weeklyStats: { weekLabel: string; checkIns: number; clean: number; relapsed: number }[];
  monthlyStats: { monthLabel: string; checkIns: number; clean: number; relapsed: number }[];
  relapseByDay: { day: string; count: number }[];
  journalCount: number;
}

type TabId = 'home' | 'calendar' | 'stats' | 'achievements' | 'leaderboard' | 'settings';

// ─── Constants ────────────────────────────────────────────────────
const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];

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
const englishDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const arabicMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const englishMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const achievementKeys = [
  { id: 'first_day', key: 'ach_first_day', descKey: 'ach_first_day_desc', icon: Sparkles, threshold: 1, color: 'from-blue-500 to-cyan-500' },
  { id: 'three_days', key: 'ach_three_days', descKey: 'ach_three_days_desc', icon: TrendingUp, threshold: 3, color: 'from-emerald-500 to-green-500' },
  { id: 'week_clean', key: 'ach_week', descKey: 'ach_week_desc', icon: Shield, threshold: 7, color: 'from-emerald-500 to-teal-500' },
  { id: 'two_weeks', key: 'ach_two_weeks', descKey: 'ach_two_weeks_desc', icon: Star, threshold: 14, color: 'from-amber-500 to-yellow-500' },
  { id: 'month_clean', key: 'ach_month', descKey: 'ach_month_desc', icon: Trophy, threshold: 30, color: 'from-orange-500 to-amber-500' },
  { id: 'two_months', key: 'ach_two_months', descKey: 'ach_two_months_desc', icon: Flame, threshold: 60, color: 'from-red-500 to-orange-500' },
  { id: 'quarter_year', key: 'ach_quarter', descKey: 'ach_quarter_desc', icon: Award, threshold: 90, color: 'from-purple-500 to-pink-500' },
  { id: 'half_year', key: 'ach_half', descKey: 'ach_half_desc', icon: Heart, threshold: 180, color: 'from-rose-500 to-red-500' },
  { id: 'full_year', key: 'ach_year', descKey: 'ach_year_desc', icon: Crown, threshold: 365, color: 'from-yellow-400 to-amber-500' },
];

// ─── Helpers ──────────────────────────────────────────────────────
function getDayKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr: string, lang: Lang) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return lang === 'ar' ? 'اليوم' : 'Today';
  if (date.toDateString() === yesterday.toDateString()) return lang === 'ar' ? 'أمس' : 'Yesterday';
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Login Screen ────────────────────────────────────────────────
function LoginScreen() {
  const { tx, lang } = useLang();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const supabase = createClient();
  const isRTL = lang === 'ar';
  const COOLDOWN_SECONDS = 60;

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    const savedUntil = localStorage.getItem('otp_cooldown_until');
    if (savedUntil) {
      const remaining = Math.floor((parseInt(savedUntil, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      } else {
        localStorage.removeItem('otp_cooldown_until');
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem('otp_cooldown_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown > 0]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0) return;
    setError(''); setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    if (error) {
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many')) {
        setError(tx('rateLimitError'));
        // Set a longer cooldown when rate limited by server
        const longerCooldown = 120;
        const until = Date.now() + longerCooldown * 1000;
        localStorage.setItem('otp_cooldown_until', String(until));
        setCooldown(longerCooldown);
      } else {
        setError(error.message);
      }
    } else {
      setOtpSent(true);
      const until = Date.now() + COOLDOWN_SECONDS * 1000;
      localStorage.setItem('otp_cooldown_until', String(until));
      setCooldown(COOLDOWN_SECONDS);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otpCode, type: 'email' });
    if (error) setError(tx('invalidOtp'));
    setLoading(false);
  };

  const handleChangeEmail = () => {
    setOtpSent(false); setError(''); setOtpCode('');
  };

  const isSendDisabled = loading || cooldown > 0;
  const sendButtonText = loading ? tx('sending') : (cooldown > 0 ? `${tx('resendIn')} ${cooldown}${cooldown > 1 ? '' : ''} ${tx('seconds')}` : tx('sendOtp'));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
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
          <h1 className={`text-4xl font-bold bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-3 ${isRTL ? 'font-arabic' : ''}`}>{tx('appName')}</h1>
          <p className="text-gray-400 text-lg">{tx('appDesc')}</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800/50 shadow-2xl">
            <CardContent className="p-6">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white">{tx('loginTitle')}</h3>
                    <p className="text-xs text-gray-400">{tx('loginSubtitle')}</p>
                  </div>
                  <Input type="email" placeholder={tx('emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 text-base" dir="ltr" />
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={isSendDisabled} className={`w-full h-12 font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/25 ${cooldown > 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'}`}>{sendButtonText}</Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white">{tx('enterCode')}</h3>
                    <p className="text-xs text-gray-400" dir="ltr">{tx('sentTo')} {email}</p>
                  </div>
                  <Input maxLength={6} type="text" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="h-16 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 text-center text-3xl tracking-[0.5em] font-mono" dir="ltr" />
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={loading || otpCode.length !== 6} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/25">{loading ? tx('verifying') : tx('login')}</Button>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => handleSendOtp()} disabled={cooldown > 0} className={`w-full text-xs py-2 rounded-lg transition-colors ${cooldown > 0 ? 'text-gray-600 cursor-not-allowed' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}`}>
                      {cooldown > 0 ? `${tx('resendIn')} ${cooldown} ${tx('seconds')}` : tx('resendOtp')}
                    </button>
                    <button type="button" onClick={handleChangeEmail} className="w-full text-xs text-gray-500 hover:text-gray-300">{tx('changeEmail')}</button>
                  </div>
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
function HomeTab({ stats, checkinLoading, message, messageType, checkinMood, setCheckinMood, checkinNote, setCheckinNote, onCheckIn }: {
  stats: StatsData; checkinLoading: boolean; message: string; messageType: 'success' | 'relapse' | '';
  checkinMood: number; setCheckinMood: (v: number) => void; checkinNote: string; setCheckinNote: (v: string) => void;
  onCheckIn: (relapsed: boolean) => void;
}) {
  const { tx, lang } = useLang();
  if (!stats) return null;
  const { user, todayCheckedIn, todayRelapsed, recentCheckIns, totalCheckIns } = stats;
  const goalPercent = user.goalStreak > 0 ? Math.min((user.streakDays / user.goalStreak) * 100, 100) : 0;
  const todayBadgeClass = todayRelapsed ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
  const todayBadgeText = todayRelapsed ? tx('loggedRelapse') : '✨ ' + tx('cleanDay');
  const moodLabelsAr = ['سيء جداً', 'سيء', 'عادي', 'جيد', 'ممتاز'];
  const moodLabelsEn = ['Very bad', 'Bad', 'Okay', 'Good', 'Excellent'];
  const moodLabels = lang === 'ar' ? moodLabelsAr : moodLabelsEn;

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={scaleIn}>
        <Card className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl border-emerald-800/30 overflow-hidden">
          <CardContent className="p-6 text-center relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <span className="text-emerald-300 text-sm font-medium">{tx('consecutiveDays')}</span>
            </div>
            <motion.div key={user.streakDays} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-7xl font-black bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent mb-1">{user.streakDays}</motion.div>
            <p className="text-gray-400 text-sm mb-3">{tx('freedomDays')}</p>
            <div className="max-w-xs mx-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{tx('progressGoal')} ({user.goalStreak} {tx('day')})</span>
                <span className="text-xs text-emerald-400 font-medium">{Math.round(goalPercent)}%</span>
              </div>
              <Progress value={goalPercent} className="h-2.5 bg-gray-800" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-400" /></div><p className="text-xs text-gray-400">{tx('bestStreak')}</p><p className="text-lg font-bold text-white">{user.bestStreak}</p></CardContent></Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Star className="w-4 h-4 text-emerald-400" /></div><p className="text-xs text-gray-400">{tx('checkins')}</p><p className="text-lg font-bold text-white">{totalCheckIns}</p></CardContent></Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center"><Snowflake className="w-4 h-4 text-sky-400" /></div><p className="text-xs text-gray-400">{tx('freezes')}</p><p className="text-lg font-bold text-white">{user.streakFreezesLeft}</p></CardContent></Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div key={message} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.3 }}>
            <Card className={`border ${messageType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}><CardContent className="p-4 text-center"><p className={`text-sm font-medium ${messageType === 'success' ? 'text-emerald-300' : 'text-orange-300'}`}>{message}</p></CardContent></Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-1">{tx('practiceToday')}</h3>
              <p className="text-xs text-gray-400">{tx('beHonest')}</p>
            </div>
            {!todayCheckedIn ? (
              <motion.div className="space-y-4" initial="hidden" animate="visible" variants={containerVariants}>
                <motion.div variants={itemVariants}>
                  <p className="text-xs text-gray-400 text-center mb-2">{tx('howFeel')}</p>
                  <div className="flex items-center justify-center gap-3">
                    {moodEmojis.map((emoji, i) => {
                      const moodBtnClass = checkinMood === i + 1 ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110' : 'hover:bg-gray-800/50';
                      return <button key={i} onClick={() => setCheckinMood(i + 1)} className={`text-2xl p-2 rounded-xl transition-all duration-200 ${moodBtnClass}`}>{emoji}</button>;
                    })}
                  </div>
                  {checkinMood > 0 && <p className="text-xs text-emerald-400 text-center mt-1">{moodLabels[checkinMood - 1]}</p>}
                </motion.div>
                <motion.div variants={itemVariants}><Textarea placeholder={tx('dailyNote')} value={checkinNote} onChange={(e) => setCheckinNote(e.target.value)} className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 text-sm min-h-[60px]" rows={2} /></motion.div>
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                  <Button onClick={() => onCheckIn(false)} disabled={checkinLoading} className="w-full h-14 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-base"><div className="flex items-center gap-2"><Shield className="w-5 h-5" /><span>{tx('noDidNot')}</span></div></Button>
                  <Button onClick={() => onCheckIn(true)} disabled={checkinLoading} className="w-full h-14 bg-gradient-to-l from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 text-base"><div className="flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" /><span>{tx('yes')}</span></div></Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-300 text-sm">{tx('alreadyChecked')}</span></div>
                <div className="mt-3"><Badge variant="outline" className={todayBadgeClass}>{todayBadgeText}</Badge></div>
                {stats.todayNote && <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{stats.todayNote}</p>}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {recentCheckIns.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{tx('recentLog')}</h3>
                <span className="text-xs text-gray-500">{recentCheckIns.length} {tx('records')}</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentCheckIns.map((checkIn, index) => {
                  const bgClass = checkIn.relapsed ? 'bg-red-500/10' : 'bg-emerald-500/10';
                  const badgeClass = checkIn.relapsed ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
                  const badgeText = checkIn.relapsed ? tx('relapse') : tx('clean');
                  const iconEl = checkIn.relapsed ? <ArrowLeftRight className="w-4 h-4 text-red-400" /> : <Shield className="w-4 h-4 text-emerald-400" />;
                  return (
                    <motion.div key={checkIn.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass}`}>{iconEl}</div><p className="text-sm text-white">{formatDate(checkIn.date, lang)}</p></div>
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
  const { tx, lang } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthCheckIns, setMonthCheckIns] = useState<CheckIn[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const { user } = stats;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const months = lang === 'ar' ? arabicMonths : englishMonths;
  const days = lang === 'ar' ? arabicDays : englishDays;

  useEffect(() => {
    const fetchCalendar = async () => {
      setCalLoading(true);
      try {
        const res = await fetch(`/api/calendar?year=${year}&month=${month + 1}`);
        const data = await res.json();
        setMonthCheckIns(data.checkIns || []);
      } catch {} finally { setCalLoading(false); }
    };
    fetchCalendar();
  }, [year, month]);

  const checkInMap: Record<string, CheckIn> = {};
  monthCheckIns.forEach((ci) => { checkInMap[getDayKey(ci.date)] = ci; });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startOffset = (firstDay.getDay() + 1) % 7;
  const todayKey = getDayKey(new Date().toISOString());

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(<div key={`empty-${i}`} className="h-10" />);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ci = checkInMap[dateKey];
    const isToday = dateKey === todayKey;
    const dayNumClass = isToday ? 'bg-emerald-500 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-300';
    let dotColor = 'bg-gray-700'; let borderColor = 'border-gray-800/50';
    if (ci) { if (ci.relapsed) { dotColor = 'bg-red-500'; borderColor = 'border-red-500/20'; } else { dotColor = 'bg-emerald-500'; borderColor = 'border-emerald-500/20'; } }
    cells.push(<div key={day} className={`h-10 flex flex-col items-center justify-center rounded-lg border ${borderColor} hover:bg-gray-800/30 transition-colors`}><div className={dayNumClass}><span className="text-xs">{day}</span></div><div className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-0.5`} /></div>);
  }

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={scaleIn}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
              <h3 className="text-lg font-bold text-white">{months[month]} {year}</h3>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">{days.map((d) => <div key={d} className="text-center text-[10px] text-gray-500 font-medium py-1">{d}</div>)}</div>
            {calLoading ? <div className="flex items-center justify-center py-8"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full" /></div> : <div className="grid grid-cols-7 gap-1">{cells}</div>}
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-gray-400">{tx('cleanDayDot')}</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs text-gray-400">{tx('relapseDot')}</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-700" /><span className="text-xs text-gray-400">{tx('notLogged')}</span></div>
          </div>
        </CardContent></Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><Flame className="w-5 h-5 text-orange-400" /></div><div><p className="text-sm text-gray-400">{tx('currentStreak')}</p><p className="text-xl font-bold text-white">{user.streakDays} {tx('day')}</p></div></div>
        </CardContent></Card>
      </motion.div>
    </motion.div>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────
function StatsTab({ stats }: { stats: StatsData }) {
  const { tx } = useLang();
  const { user, totalCheckIns, cleanDays, relapsedDays } = stats;
  const cleanRate = totalCheckIns > 0 ? Math.round((cleanDays / totalCheckIns) * 100) : 0;
  const last7Days: { label: string; total: number; clean: number; relapsed: number }[] = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dayKey = getDayKey(d.toISOString()); const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }); const dayCIs = stats.recentCheckIns.filter((ci) => getDayKey(ci.date) === dayKey); const cl = dayCIs.filter((ci) => !ci.relapsed).length; const rl = dayCIs.filter((ci) => ci.relapsed).length; last7Days.push({ label: dayLabel, clean: cl, relapsed: rl, total: cl + rl }); }
  const maxDayTotal = Math.max(...last7Days.map((d) => d.total), 1);

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Shield className="w-4 h-4 text-emerald-400" /></div><p className="text-xs text-gray-400">{tx('cleanDays')}</p><p className="text-xl font-bold text-emerald-400">{cleanDays}</p></CardContent></Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><ArrowLeftRight className="w-4 h-4 text-red-400" /></div><p className="text-xs text-gray-400">{tx('relapseDays')}</p><p className="text-xl font-bold text-red-400">{relapsedDays}</p></CardContent></Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-400" /></div><p className="text-xs text-gray-400">{tx('totalCheckins')}</p><p className="text-xl font-bold text-blue-400">{totalCheckIns}</p></CardContent></Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-amber-400" /></div><p className="text-xs text-gray-400">{tx('cleanRate')}</p><p className="text-xl font-bold text-amber-400">{cleanRate}%</p></CardContent></Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-5">
          <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-white">{tx('cleanRateTitle')}</h3><span className="text-sm text-emerald-400 font-bold">{cleanRate}%</span></div>
          <Progress value={cleanRate} className="h-3 bg-gray-800" />
          <div className="flex items-center justify-between mt-2"><span className="text-xs text-gray-500">{cleanDays} {tx('cleanDays')}</span><span className="text-xs text-gray-500">{relapsedDays} {tx('relapseDays')}</span></div>
        </CardContent></Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-5">
          <h3 className="font-bold text-white mb-4">{tx('last7Days')}</h3>
          <div className="flex items-end gap-2 h-32">
            {last7Days.map((day, i) => { const bh = day.total > 0 ? Math.max((day.total / maxDayTotal) * 100, 12) : 6; const bc = day.relapsed > day.clean ? 'bg-red-500' : 'bg-emerald-500'; return <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className={`w-full ${bc} rounded-t transition-all duration-300`} style={{ height: `${bh}%` }} /><span className="text-[9px] text-gray-500 truncate w-full text-center">{day.label}</span></div>; })}
          </div>
        </CardContent></Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-5">
          <h3 className="font-bold text-white mb-4">{tx('streakSummary')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /><span className="text-sm text-gray-400">{tx('current')}</span></div><span className="font-bold text-white">{user.streakDays} {tx('day')}</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /><span className="text-sm text-gray-400">{tx('best')}</span></div><span className="font-bold text-white">{user.bestStreak} {tx('day')}</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /><span className="text-sm text-gray-400">{tx('goal')}</span></div><span className="font-bold text-white">{user.goalStreak} {tx('day')}</span></div>
          </div>
        </CardContent></Card>
      </motion.div>
    </motion.div>
  );
}

// ─── Achievements Tab ────────────────────────────────────────────
function AchievementsTab({ stats }: { stats: StatsData }) {
  const { tx } = useLang();
  const { user } = stats;
  const unlockedCount = achievementKeys.filter((a) => user.bestStreak >= a.threshold).length;

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={scaleIn}>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 backdrop-blur-xl border-amber-800/30">
          <CardContent className="p-5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-3 shadow-lg shadow-amber-500/20"><Award className="w-7 h-7 text-white" /></div>
            <h3 className="text-lg font-bold text-white mb-1">{tx('achievementsTitle')}</h3>
            <p className="text-sm text-gray-400">{tx('unlockedCount')} {unlockedCount} {tx('of')} {achievementKeys.length}</p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={itemVariants} className="space-y-2">
        {achievementKeys.map((ach) => {
          const unlocked = user.bestStreak >= ach.threshold;
          const Icon = ach.icon;
          const cardClass = unlocked ? 'bg-gray-900/60 border-gray-800/50' : 'bg-gray-900/30 border-gray-800/30 opacity-60';
          const iconBgClass = unlocked ? `bg-gradient-to-br ${ach.color}` : 'bg-gray-800';
          const statusEl = unlocked
            ? <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />{tx('unlocked')}</span>
            : <span className="text-xs text-gray-500 flex items-center gap-1"><Lock className="w-3 h-3" />{ach.threshold} {tx('day')}</span>;
          return (
            <motion.div key={ach.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
              <Card className={cardClass}><CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${iconBgClass} flex items-center justify-center shadow-lg`}><Icon className={`w-5 h-5 ${unlocked ? 'text-white' : 'text-gray-600'}`} /></div>
                  <div className="flex-1"><p className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-gray-500'}`}>{tx(ach.key)}</p><p className="text-xs text-gray-500">{tx(ach.descKey)}</p></div>
                  {statusEl}
                </div>
              </CardContent></Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

// ─── Leaderboard Tab ─────────────────────────────────────────────
function LeaderboardTab({ stats }: { stats: StatsData }) {
  const { tx } = useLang();
  const { user } = stats;
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'streaks' | 'bestStreaks' | 'checkins' | 'cleanDays'>('streaks');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setLeaderboardData(data);
      } catch {} finally { setLoading(false); }
    };
    fetchLeaderboard();
  }, []);

  const categories = [
    { id: 'streaks' as const, label: tx('topStreaks'), icon: Flame, color: 'text-orange-400' },
    { id: 'bestStreaks' as const, label: tx('topBestStreaks'), icon: Trophy, color: 'text-amber-400' },
    { id: 'checkins' as const, label: tx('topCheckins'), icon: Calendar, color: 'text-blue-400' },
    { id: 'cleanDays' as const, label: tx('topCleanDays'), icon: Shield, color: 'text-emerald-400' },
  ];

  const getActiveList = () => {
    if (!leaderboardData) return [];
    switch (activeCategory) {
      case 'streaks': return leaderboardData.topStreaks || [];
      case 'bestStreaks': return leaderboardData.topBestStreaks || [];
      case 'checkins': return leaderboardData.topCheckIns || [];
      case 'cleanDays': return leaderboardData.topCleanDays || [];
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-500 w-5 text-center">{rank}</span>;
  };

  const getValueForCategory = (item: any) => {
    switch (activeCategory) {
      case 'streaks': return `${item.streakDays} ${tx('day')}`;
      case 'bestStreaks': return `${item.bestStreak} ${tx('day')}`;
      case 'checkins': return `${item.totalCheckIns}`;
      case 'cleanDays': return `${item.cleanDays}`;
    }
  };

  const activeList = getActiveList();

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={scaleIn}>
        <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-xl border-purple-800/30">
          <CardContent className="p-5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-3 shadow-lg shadow-purple-500/20"><Crown className="w-7 h-7 text-white" /></div>
            <h3 className="text-lg font-bold text-white mb-1">{tx('leaderboardTitle')}</h3>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            const catClass = isActive ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-900/40 border-gray-800/50';
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap transition-all ${catClass}`}>
                <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Your Rank */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Flame className="w-5 h-5 text-emerald-400" /></div>
                <div><p className="text-sm text-gray-400">{tx('yourRank')}</p><p className="font-bold text-white">{user.streakDays} {tx('day')}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rankings */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="flex items-center justify-center py-12"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full" /></div>
        ) : activeList.length === 0 ? (
          <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-8 text-center"><p className="text-gray-500">{tx('noData')}</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {activeList.map((item: any) => {
              const isTop3 = item.rank <= 3;
              const rowClass = isTop3 ? 'bg-gray-900/80 border-gray-700/50' : 'bg-gray-900/40 border-gray-800/30';
              return (
                <motion.div key={item.rank} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: item.rank * 0.03 }}>
                  <Card className={rowClass}><CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">{getMedalIcon(item.rank)}</div>
                        <p className={`font-bold text-sm ${isTop3 ? 'text-white' : 'text-gray-400'}`}>{item.name || (tx('notRanked'))}</p>
                      </div>
                      <span className={`font-bold ${isTop3 ? 'text-emerald-400' : 'text-gray-400'}`}>{getValueForCategory(item)}</span>
                    </div>
                  </CardContent></Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────
function SettingsTab({ stats, onUpdate }: { stats: StatsData; onUpdate: () => void }) {
  const { tx, lang, setLang } = useLang();
  const { user } = stats;
  const [name, setName] = useState(user.name || '');
  const [goalStreak, setGoalStreak] = useState(user.goalStreak);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() || null, goalStreak }) });
      const data = await res.json();
      if (data.user) { setSaveMsg(tx('saved')); onUpdate(); } else { setSaveMsg(tx('saveError')); }
    } catch { setSaveMsg(tx('saveError')); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(''), 3000); }
  };

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    try { localStorage.setItem('lang', newLang); } catch {}
  };

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={scaleIn}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{tx('profile')}</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-gray-400 mb-1 block">{tx('name')}</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tx('namePlaceholder')} className="h-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 text-sm" /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">{tx('email')}</label><Input value={user.email} disabled className="h-10 bg-gray-800/30 border-gray-700 text-gray-500 text-sm" dir="ltr" /></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" />{tx('language')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleLangChange('ar')} className={`py-3 rounded-xl border text-sm font-medium transition-all ${lang === 'ar' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-gray-800/30 border-gray-700 text-gray-500 hover:text-gray-300'}`}>{tx('arabic')}</button>
              <button onClick={() => handleLangChange('en')} className={`py-3 rounded-xl border text-sm font-medium transition-all ${lang === 'en' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-gray-800/30 border-gray-700 text-gray-500 hover:text-gray-300'}`}>{tx('english')}</button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" />{tx('streakGoal')}</h3>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setGoalStreak(Math.max(1, goalStreak - 1))} className="w-10 h-10 rounded-xl bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50"><Minus className="w-4 h-4" /></button>
              <div className="text-center"><p className="text-4xl font-black text-emerald-400">{goalStreak}</p><p className="text-xs text-gray-500">{tx('day')}</p></div>
              <button onClick={() => setGoalStreak(goalStreak + 1)} className="w-10 h-10 rounded-xl bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[7, 30, 90, 365].map((val) => {
                const btnClass = goalStreak === val ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-gray-800/30 border-gray-700 text-gray-500';
                return <button key={val} onClick={() => setGoalStreak(val)} className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${btnClass}`}>{val}</button>;
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Snowflake className="w-4 h-4 text-sky-400" />{tx('streakFreeze')}</h3>
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30"><div><p className="text-sm text-white">{tx('freezesAvailable')}</p><p className="text-xs text-gray-500">{tx('renewedWeekly')}</p></div><span className="text-xl font-bold text-sky-400">{user.streakFreezesLeft}</span></div>
        </CardContent></Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        {saveMsg && <p className={`text-sm text-center mb-2 ${saveMsg.includes('✅') || saveMsg.includes(tx('saved')) ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</p>}
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25">
          <div className="flex items-center gap-2"><Save className="w-4 h-4" /><span>{saving ? tx('saving') : tx('saveChanges')}</span></div>
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Bottom Tab Navigation ───────────────────────────────────────
function BottomNav({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }) {
  const { tx } = useLang();
  const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: 'home', label: tx('home'), icon: Home },
    { id: 'calendar', label: tx('calendar'), icon: Calendar },
    { id: 'stats', label: tx('stats'), icon: BarChart3 },
    { id: 'achievements', label: tx('achievements'), icon: Award },
    { id: 'leaderboard', label: tx('leaderboard'), icon: Crown },
    { id: 'settings', label: tx('settings'), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800/50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const tabClass = isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400';
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all duration-200 min-w-[48px] ${tabClass}`}>
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px] font-medium">{tab.label}</span>
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
  const { tx } = useLang();
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
    try { const res = await fetch('/api/stats'); const data = await res.json(); if (data.user) setStats(data); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) fetchStats(); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (session) fetchStats(); else { setStats(null); setLoading(false); } });
    return () => subscription.unsubscribe();
  }, [fetchStats]);

  const handleCheckIn = async (relapsed: boolean) => {
    setCheckinLoading(true);
    try {
      const res = await fetch('/api/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ relapsed, mood: checkinMood > 0 ? checkinMood : null, note: checkinNote.trim() || null }) });
      const data = await res.json();
      if (data.error) { setMessage(data.error); setMessageType('relapse'); return; }
      const msg = relapsed ? 'لا بأس، الطريق ليس سهلاً. المهم أنك لا تستسلم!' : 'أنت أقوى مما تتصور! استمر!';
      setMessage(msg); setMessageType(relapsed ? 'relapse' : 'success'); setCheckinMood(0); setCheckinNote(''); fetchStats();
    } catch { setMessage('حدث خطأ. حاول مرة أخرى.'); setMessageType('relapse'); } finally { setCheckinLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" /></div>;
  if (!stats) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950">
      <div className="fixed top-0 right-0 w-80 h-80 rounded-full blur-3xl bg-emerald-500/8" />
      <div className="fixed bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-teal-500/8" />
      <div className="relative z-10 max-w-lg mx-auto px-4 pb-24 pt-2">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Shield className="w-4.5 h-4.5 text-white" /></div>
            <div><h2 className="text-base font-bold text-white">{tx('appName')}</h2><p className="text-[10px] text-gray-400">{tx('loggedInSecurely')}</p></div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-400 hover:text-white hover:bg-gray-800/50"><LogOut className="w-5 h-5" /></Button>
        </div>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><HomeTab stats={stats} checkinLoading={checkinLoading} message={message} messageType={messageType} checkinMood={checkinMood} setCheckinMood={setCheckinMood} checkinNote={checkinNote} setCheckinNote={setCheckinNote} onCheckIn={handleCheckIn} /></motion.div>}
          {activeTab === 'calendar' && <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><CalendarTab stats={stats} /></motion.div>}
          {activeTab === 'stats' && <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><StatsTab stats={stats} /></motion.div>}
          {activeTab === 'achievements' && <motion.div key="achievements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><AchievementsTab stats={stats} /></motion.div>}
          {activeTab === 'leaderboard' && <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><LeaderboardTab stats={stats} /></motion.div>}
          {activeTab === 'settings' && <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><SettingsTab stats={stats} onUpdate={fetchStats} /></motion.div>}
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
  const [lang, setLang] = useState<Lang>('ar');
  const supabase = createClient();

  useEffect(() => {
    // Load saved language preference
    try { const saved = localStorage.getItem('lang'); if (saved === 'en' || saved === 'ar') setLang(saved); } catch {}
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); setLoading(false); });
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  const tx = useCallback((key: string) => {
    return t[lang][key] || key;
  }, [lang]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" /></div>;

  return (
    <LangContext.Provider value={{ lang, setLang, tx }}>
      {!session ? <LoginScreen /> : <DashboardScreen onLogout={() => { supabase.auth.signOut(); setSession(null); }} />}
    </LangContext.Provider>
  );
}
