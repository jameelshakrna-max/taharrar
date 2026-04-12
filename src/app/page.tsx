'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Trophy, Shield, LogOut, ChevronLeft, ChevronRight,
  Calendar, Star, Heart, Sparkles, ArrowLeftRight,
  Home, BarChart3, Award, Settings, Snowflake, Target,
  Bell, BookOpen, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';

const memoryStorage: Record<string, string> = {};
function safeGetItem(key: string): string | null { try { return localStorage.getItem(key); } catch { return memoryStorage[key] || null; } }
function safeSetItem(key: string, value: string): void { try { localStorage.setItem(key, value); } catch { memoryStorage[key] = value; } }
function safeRemoveItem(key: string): void { try { localStorage.removeItem(key); } catch { delete memoryStorage[key]; } }

interface UserData { id: string; email: string; name: string | null; streakDays: number; bestStreak: number; goalStreak: number; streakFreezesLeft: number; freezeUsedThisWeek: boolean; }
interface CheckIn { id: string; date: string; relapsed: boolean; mood: number | null; note: string | null; }
interface StatsData { user: UserData; todayCheckedIn: boolean; todayRelapsed: boolean; todayMood: number | null; todayNote: string | null; recentCheckIns: CheckIn[]; totalCheckIns: number; cleanDays: number; relapsedDays: number; weeklyStats: { weekLabel: string; checkIns: number; clean: number; relapsed: number }[]; monthlyStats: { monthLabel: string; checkIns: number; clean: number; relapsed: number }[]; relapseByDay: { day: string; count: number }[]; journalCount: number; }
interface Achievement { type: string; name: string; description: string; icon: string; unlocked: boolean; unlockedAt: string | null; }

type TabId = 'home' | 'calendar' | 'stats' | 'achievements' | 'settings';

const successMessages = ['أنت أقوى مما تتصور! استمر!', 'كل يوم هو انتصار جديد. فخرًا بك!', 'ستصبح أقوى مع كل يوم يمر'];
const relapseMessages = ['لا بأس، الطريق ليس سهلاً. المهم أنك لا تستسلم!', 'كل بداية جديدة هي فرصة أقوى. ابدأ من جديد!'];
const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
const moodLabels = ['سيء جداً', 'سيء', 'عادي', 'جيد', 'ممتاز'];
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
    transition: { duration: 0.5, ease: "easeOut" },
  },
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
    e.preventDefault(); setError(''); setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    if (error) setError(error.message); else setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otpCode, type: 'email' });
    if (error) setError('رمز التحقق غير صحيح'); setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>
      <motion.div className="w-full max-w-md relative z-10" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={scaleIn} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/25">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-3">رحلتي للتحرر</h1>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800/50 shadow-2xl">
            <CardContent className="p-6">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <Input type="email" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-800/50 border-gray-700 text-white text-right text-base" dir="ltr" />
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-xl">إرسال رمز التحقق</Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <Input maxLength={6} type="text" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="h-16 bg-gray-800/50 border-gray-700 text-white text-center text-3xl tracking-[0.5em] font-mono" dir="ltr" />
                  {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">{error}</p>}
                  <Button type="submit" disabled={loading || otpCode.length !== 6} className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-xl">تسجيل الدخول</Button>
                  <button type="button" onClick={() => { setOtpSent(false); setError(''); }} className="w-full text-xs text-gray-500 hover:text-gray-300">تغيير البريد</button>
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
function HomeTab({ stats, checkinLoading, message, messageType, checkinMood, setCheckinMood, checkinNote, setCheckinNote, onCheckIn }: { stats: StatsData; checkinLoading: boolean; message: string; messageType: 'success' | 'relapse' | ''; checkinMood: number; setCheckinMood: (v: number) => void; checkinNote: string; setCheckinNote: (v: string) => void; onCheckIn: (relapsed: boolean) => void; }) {
  if (!stats) return null;
  const { user, todayCheckedIn, todayRelapsed, recentCheckIns, totalCheckIns } = stats;
  const goalPercent = user.goalStreak > 0 ? Math.min((user.streakDays / user.goalStreak) * 100, 100) : 0;
  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={scaleIn}>
        <Card className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl border-emerald-800/30 overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2"><Flame className="w-6 h-6 text-orange-400" /><span className="text-emerald-300 text-sm font-medium">يوم متتالي بدون العادة</span></div>
            <motion.div key={user.streakDays} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-7xl font-black bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent mb-1">{user.streakDays}</motion.div>
            <p className="text-gray-400 text-sm mb-3">أيام من الحرية</p>
            <div className="max-w-xs mx-auto">
              <div className="flex items-center justify-between mb-1"><span className="text-xs text-gray-400">التقدم نحو الهدف ({user.goalStreak} يوم)</span><span className="text-xs text-emerald-400 font-medium">{Math.round(goalPercent)}%</span></div>
              <Progress value={goalPercent} className="h-2.5 bg-gray-800" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-400" /></div><p className="text-xs text-gray-400">أفضل سلسلة</p><p className="text-lg font-bold text-white">{user.bestStreak}</p></CardContent></Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Star className="w-4 h-4 text-emerald-400" /></div><p className="text-xs text-gray-400">التسجيلات</p><p className="text-lg font-bold text-white">{totalCheckIns}</p></CardContent></Card>
        <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-3 flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center"><Snowflake className="w-4 h-4 text-sky-400" /></div><p className="text-xs text-gray-400">التجميد</p><p className="text-lg font-bold text-white">{user.streakFreezesLeft}</p></CardContent></Card>
      </motion.div>
      <AnimatePresence mode="wait">{message && (<motion.div key={message} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}><Card className={`border ${messageType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}><CardContent className="p-4 text-center"><p className={`text-sm font-medium ${messageType === 'success' ? 'text-emerald-300' : 'text-orange-300'}`}>{message}</p></CardContent></Card></motion.div>}
      <motion.div variants={itemVariants}><Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-5"><div className="text-center mb-4"><h3 className="text-lg font-bold text-white mb-1">هل مارست العادة اليوم؟</h3><p className="text-xs text-gray-400">كن صادقًا مع نفسك</p></div>{!todayCheckedIn ? (<motion.div className="space-y-4" initial="hidden" animate="visible" variants={containerVariants}><motion.div variants={itemVariants}><p className="text-xs text-gray-400 text-center mb-2">كيف تشعر اليوم؟</p><div className="flex items-center justify-center gap-3">{moodEmojis.map((emoji, i) => (<button key={i} onClick={() => setCheckinMood(i + 1)} className={`text-2xl p-2 rounded-xl transition-all duration-200 ${checkinMood === i + 1 ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110' : 'hover:bg-gray-800/50'}`}>{emoji}</button>))}</div>{checkinMood > 0 && <p className="text-xs text-emerald-400 text-center mt-1">{moodLabels[checkinMood - 1]}</p>}</motion.div><motion.div variants={itemVariants}><Textarea placeholder="ملاحظة يومية (اختياري)..." value={checkinNote} onChange={(e) => setCheckinNote(e.target.value)} className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 text-right text-sm min-h-[60px]" rows={2} /></motion.div><motion.div variants={itemVariants} className="grid grid-cols-2 gap-3"><Button onClick={() => onCheckIn(false)} disabled={checkinLoading} className="w-full h-14 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-base"><div className="flex items-center gap-2"><Shield className="w-5 h-5" /><span>لا، لم أمارسها</span></div></Button><Button onClick={() => onCheckIn(true)} disabled={checkinLoading} className="w-full h-14 bg-gradient-to-l from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 text-base"><div className="flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" /><span>نعم</span></div></Button></motion.div></motion.div>) : (<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-3"><div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-300 text-sm">لقد قمت بتسجيل يومك اليوم</span></div><div className="mt-3"><Badge variant="outline" className={todayRelapsed ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'}>{todayRelapsed ? 'سجل كانتكاس' : ' ✨ يوم نظيف'}</Badge></div></motion.div>)}</CardContent></Card></motion.div>
      {recentCheckIns.length > 0 && (<motion.div variants={itemVariants}><Card className="bg-gray-900/60 backdrop-blur-xl border-gray-800/50"><CardContent className="p-5"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />السجل الأخير</h3><span className="text-xs text-gray-500">{recentCheckIns.length} تسجيل</span></div><div className="space-y-2 max-h-64 overflow-y-auto pr-1">{recentCheckIns.map((checkIn, index) => (<motion.div key={checkIn.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${checkIn.relapsed ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>{checkIn.relapsed ? <ArrowLeftRight className="w-4 h-4 text-red-400" /> : <Shield className="w-4 h-4 text-emerald-400" />}</div><div><p className="text-sm text-white">{formatDate(checkIn.date)}</p></div></div><Badge variant="outline" className={`text-xs ${checkIn.relapsed ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'}`}>{checkIn.relapsed ? 'انتكاس' : 'نظيف'}</Badge></motion.div>))}</div></CardContent></Card></motion.div>)}
    </motion.div>
  );
}

// ─── Bottom Nav & Main Dashboard ────────────────────────────────
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
        {tabs.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (
          <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200 min-w-[56px] ${isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {isActive && <motion.div layoutId="tab-indicator" className="w-1 h-1 rounded-full bg-emerald-400" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
          </button>
        ); })}
      </div>
    </nav>
  );
}

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

  const fetchStats = useCallback(async () => { try { const res = await fetch('/api/stats'); const data = await res.json(); if (data.user) setStats(data); } catch (error) { console.error('Failed to fetch stats:', error); } finally { setLoading(false); } }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) fetchStats(); else { setStats(null); setLoading(false); } });
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) fetchStats(); else setLoading(false); };
    return () => subscription.unsubscribe();
  }, [fetchStats]);

  const handleCheckIn = async (relapsed: boolean) => {
    setCheckinLoading(true);
    try {
      const res = await fetch('/api/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ relapsed, mood: checkinMood > 0 ? checkinMood : null, note: checkinNote.trim() || null }) });
      const data = await res.json();
      if (data.error) { setMessage(data.error); setMessageType('relapse'); } 
      else { setMessage(relapsed ? 'لا بأس، المهم أنك لا تستسلم!' : 'أنت أقوى مما تتصور! استمر!'); setMessageType(relapsed ? 'relapse' : 'success'); setCheckinMood(0); setCheckinNote(''); fetchStats(); }
    } catch { setMessage('حدث خطأ'); setMessageType('relapse'); } finally { setCheckinLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" /></div>;
  if (!stats) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950">
      <div className="fixed top-0 right-0 w-80 h-80 rounded-full blur-3xl bg-emerald-500/8" /><div className="fixed bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-teal-500/8" />
      <div className="relative z-10 max-w-lg mx-auto px-4 pb-24 pt-2">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Shield className="w-4.5 h-4.5 text-white" /></div><div><h2 className="text-base font-bold text-white">رحلتي للتحرر</h2><p className="text-[10px] text-gray-400" dir="ltr"> Logged in securely</p></div></div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-400 hover:text-white hover:bg-gray-800/50"><LogOut className="w-5 h-5" /></Button>
        </div>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><HomeTab stats={stats} checkinLoading={checkinLoading} message={message} messageType={messageType} checkinMood={checkinMood} setCheckinMood={setCheckinMood} checkinNote={checkinNote} setCheckinNote={setCheckinNote} onCheckIn={handleCheckIn} /></motion.div>}
          {/* Restore other tabs later by adding their components back here */}
          {activeTab !== 'home' && <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-20 text-center"><h2 className="text-2xl font-bold text-white">جاري استعادة هذا القسم...</h2></motion.div>}
        </AnimatePresence>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default function TaharrurPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setLoading(false); else setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" /></div>;
  if (!session) return <LoginScreen />;
  return <DashboardScreen onLogout={() => { supabase.auth.signOut(); setSession(null); }} />;
}