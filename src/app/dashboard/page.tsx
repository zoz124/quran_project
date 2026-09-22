'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import TasbihLoader from '@/components/ui/TasbihLoader';

interface Profile {
  name: string;
  settings: any;
}

interface Stats {
  totalVerifiedAyahs: number;
  overallProgress: number;
  completedJuzCount: number;
  completedSurahsCount: number;
  weeklySessionsCount: number;
  streakDays: number;
  juzProgressList: number[];
}

interface ActiveSession {
  id: string;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  completed_ayahs: number;
  updated_at: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const cardHoverVariants: Variants = {
  rest: { scale: 1, boxShadow: '0 4px 20px rgba(212, 175, 55, 0.1)' },
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 40px rgba(212, 175, 55, 0.25)',
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalVerifiedAyahs: 0,
    overallProgress: 0,
    completedJuzCount: 0,
    completedSurahsCount: 0,
    weeklySessionsCount: 0,
    streakDays: 0,
    juzProgressList: Array(30).fill(0),
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // 1. جلب بيانات الملف الشخصي
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileData) setProfile(profileData);

        // 2. جلب آخر جلسة حفظ جارية لم تكتمل
        const { data: latestActive } = await supabase
          .from('memorization_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'in_progress')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestActive) {
          setActiveSession(latestActive);
        }

        // 3. جلب الجلسات والسجلات لحساب الإحصائيات
        const [{ data: sessions }, { data: logs }] = await Promise.all([
          supabase.from('memorization_sessions').select('*').eq('user_id', userId),
          supabase.from('memorization_logs').select('*').eq('user_id', userId),
        ]);

        const allSessions = sessions || [];
        const allLogs = logs || [];

        const uniqueAyahsSet = new Set<string>();

        allSessions.forEach((s) => {
          if (s.start_ayah && s.end_ayah) {
            for (let a = s.start_ayah; a <= s.end_ayah; a++) {
              uniqueAyahsSet.add(`${s.surah_number}:${a}`);
            }
          }
        });

        allLogs.forEach((log) => {
          if (log.start_ayah && log.end_ayah) {
            for (let a = log.start_ayah; a <= log.end_ayah; a++) {
              uniqueAyahsSet.add(`${log.surah_number}:${a}`);
            }
          }
        });

        const totalVerifiedAyahs = uniqueAyahsSet.size;

        const TOTAL_QURAN_AYAHS = 6236;
        const overallProgress = Math.min(100, Math.round((totalVerifiedAyahs / TOTAL_QURAN_AYAHS) * 100));
        const completedJuzCount = Math.floor((totalVerifiedAyahs / TOTAL_QURAN_AYAHS) * 30);

        const completedSurahsSet = new Set(
          allSessions.filter(s => s.status === 'completed').map(s => s.surah_number)
        );

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklySessionsCount = allLogs.filter(
          log => new Date(log.created_at) >= oneWeekAgo
        ).length || allSessions.filter(
          s => new Date(s.updated_at || s.created_at) >= oneWeekAgo
        ).length;

        const activeDates = new Set(
          [...allSessions, ...allLogs].map(item =>
            new Date(item.created_at || item.updated_at).toDateString()
          )
        );

        let streakDays = 0;
        let checkDate = new Date();
        while (activeDates.has(checkDate.toDateString())) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        }

        const avgAyahsPerJuz = TOTAL_QURAN_AYAHS / 30;
        const juzProgressList = Array.from({ length: 30 }, (_, index) => {
          const ayahsForThisJuz = Math.max(0, Math.min(avgAyahsPerJuz, totalVerifiedAyahs - (index * avgAyahsPerJuz)));
          return Math.min(100, Math.round((ayahsForThisJuz / avgAyahsPerJuz) * 100));
        });

        setStats({
          totalVerifiedAyahs,
          overallProgress,
          completedJuzCount,
          completedSurahsCount: completedSurahsSet.size,
          weeklySessionsCount,
          streakDays,
          juzProgressList,
        });

      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9]">
        <TasbihLoader size="lg" text="جاري تحميل لوحة التحكم..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9] p-6 md:p-8" dir="rtl">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-800 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.section
          variants={itemVariants}
          className="relative rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23D4AF37%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-400/40 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-400/40 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-400/40 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-400/40 rounded-br-2xl" />

          <div className="relative z-10 text-center py-12 px-6">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/20"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg className="w-12 h-12 text-emerald-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              السلام عليكم{profile?.name ? `، ${profile.name}` : ''} 🌙
            </h1>
            <p className="text-xl text-emerald-100/90 mb-8">
              استمر في طريق حفظك وتقنيات تلاوتك للقرآن الكريم
            </p>

            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-200">تقدمك العام</span>
                <span className="text-amber-300 font-bold">{stats.overallProgress}%</span>
              </div>
              <div className="h-4 bg-emerald-950/60 rounded-full overflow-hidden shadow-inner border border-emerald-700/50">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.overallProgress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
              <p className="text-emerald-200/80 text-sm mt-2">
                {stats.completedJuzCount} من 30 جزء ({stats.totalVerifiedAyahs} آية متقنة)
              </p>
            </div>
          </div>
        </motion.section>

        {/* 🌟 كارت الجلسة الجارية (في حال وجود جلسة غير مكتملة) */}
        {activeSession && (
          <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6 rounded-2xl shadow-lg border-2 border-amber-400 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center text-2xl font-bold">
                  🎧
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-300">لديك جلسة حفظ جارية!</h3>
                  <p className="text-emerald-100 text-sm mt-1">
                    سورة رقم <strong>{activeSession.surah_number}</strong> (الآيات {activeSession.start_ayah} - {activeSession.end_ayah})
                  </p>
                </div>
              </div>
              <Link
                href={`/memorize/${activeSession.id}`}
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-6 py-3 rounded-xl shadow-md transition-all text-center w-full md:w-auto"
              >
                متابعة التسميع الآن 🎙️
              </Link>
            </div>
          </motion.section>
        )}

        {/* Quick Actions */}
        <motion.section variants={itemVariants}>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>⚡</span> إجراءات سريعة
          </h2>
          <div className="max-w-2xl mx-auto">
            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-800 flex items-center justify-center shadow-lg text-white">
                  <svg className="w-8 h-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  حفظ جديد
                </h3>
                <p className="text-slate-600 mb-6">
                  ابدأ جلسة حفظ جديدة لسورة أو آيات محددة بالذكاء الاصطناعي
                </p>
                <Link href="/memorize/new" className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md text-center block">
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    ابدأ الحفظ
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Progress Grid */}
        <motion.section variants={itemVariants}>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>📖</span> تقدم الأجزاء
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {stats.juzProgressList.map((progressPercent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link href={`/progress/juz/${i + 1}`} className="block">
                  <motion.div
                    className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm hover:border-emerald-600 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-lg shadow-md">
                      {i + 1}
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-2">
                      الجزء {i + 1}
                    </h3>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2 border border-slate-200">
                      <motion.div
                        className="h-full rounded-full bg-emerald-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, delay: i * 0.02 }}
                      />
                    </div>

                    <p className="text-xs font-bold text-emerald-800">
                      {progressPercent}%
                    </p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats Summary */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'الأجزاء المحفوظة', value: stats.completedJuzCount.toString(), icon: '📚', color: 'from-emerald-600 to-emerald-700' },
              { label: 'السور المكتملة', value: stats.completedSurahsCount.toString(), icon: '✨', color: 'from-amber-400 to-amber-500' },
              { label: 'جلسات هذا الأسبوع', value: stats.weeklySessionsCount.toString(), icon: '📊', color: 'from-emerald-500 to-emerald-600' },
              { label: 'أيام متتالية', value: stats.streakDays.toString(), icon: '🔥', color: 'from-orange-500 to-red-500' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md text-white text-2xl`}>
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}