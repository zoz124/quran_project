'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import TasbihLoader from '@/components/ui/TasbihLoader';

interface SurahProgress {
  surahNumber: number;
  surahName: string;
  completedAyahs: number;
  totalAyahs: number;
  percentage: number;
}

// تعريف حركات الانتقال مع تحديد النوع لعدم حدوث أخطاء TypeScript في Vercel
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// مصفوفة أسماء سور القرآن الكريم الـ 114
const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

// مصفوفة أعداد آيات سور القرآن الكريم الـ 114
const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 6, 4, 5, 6
];

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [totalVerifiedAyahs, setTotalVerifiedAyahs] = useState(0);
  const [overallProgress, setOverallProgress] = useState<number | string>(0);
  const [surahsProgress, setSurahsProgress] = useState<SurahProgress[]>([]);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        const [{ data: sessions }, { data: logs }] = await Promise.all([
          supabase.from('memorization_sessions').select('*').eq('user_id', userId),
          supabase.from('memorization_logs').select('*').eq('user_id', userId),
        ]);

        const allSessions = sessions || [];
        const allLogs = logs || [];

        const memorizedAyahsSet = new Set<string>();

        allSessions.forEach((s) => {
          if (s.surah_number && s.start_ayah != null && s.end_ayah != null) {
            for (let a = s.start_ayah; a <= s.end_ayah; a++) {
              memorizedAyahsSet.add(`${s.surah_number}:${a}`);
            }
          }
        });

        allLogs.forEach((log) => {
          if (log.surah_number && log.start_ayah != null && log.end_ayah != null) {
            for (let a = log.start_ayah; a <= log.end_ayah; a++) {
              memorizedAyahsSet.add(`${log.surah_number}:${a}`);
            }
          }
        });

        const totalUniqueCount = memorizedAyahsSet.size;
        const TOTAL_QURAN_AYAHS = 6236;

        const rawPercent = (totalUniqueCount / TOTAL_QURAN_AYAHS) * 100;
        const progressPercent = rawPercent > 0 && rawPercent < 1
          ? rawPercent.toFixed(1)
          : Math.round(rawPercent);

        const surahMap: { [key: number]: number } = {};

        memorizedAyahsSet.forEach((key) => {
          const [surahStr] = key.split(':');
          const surahNum = Number(surahStr);
          if (surahNum) {
            surahMap[surahNum] = (surahMap[surahNum] || 0) + 1;
          }
        });

        const activeSurahs: SurahProgress[] = Object.keys(surahMap).map((surahNumStr) => {
          const surahNum = Number(surahNumStr);
          const completed = surahMap[surahNum];
          const total = SURAH_AYAH_COUNTS[surahNum - 1] || 1;
          const name = SURAH_NAMES[surahNum - 1] || `رقم ${surahNum}`;

          return {
            surahNumber: surahNum,
            surahName: name,
            completedAyahs: completed,
            totalAyahs: total,
            percentage: Math.min(100, Math.round((completed / total) * 100)),
          };
        }).sort((a, b) => a.surahNumber - b.surahNumber);

        setTotalVerifiedAyahs(totalUniqueCount);
        setOverallProgress(progressPercent);
        setSurahsProgress(activeSurahs);

      } catch (err) {
        console.error('Error fetching overall progress:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-silver-50 via-white to-silver-100">
        <TasbihLoader size="lg" text="جاري تحميل التقدم الشامل..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-silver-50 via-white to-silver-100 p-6 md:p-8" dir="rtl">
      <motion.div
        className="max-w-5xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-cairo text-gradient-gold">التقدم الشامل 📊</h1>
          <Link href="/dashboard" className="text-secondary hover:underline font-cairo text-sm font-semibold">
            ← العودة للوحة التحكم
          </Link>
        </motion.div>

        {/* Total Progress Card */}
        <motion.div variants={itemVariants} className="islamic-card islamic-border p-8 text-center space-y-4">
          <h2 className="text-xl font-cairo text-[var(--color-text-muted)]">نسبة الحفظ الإجمالية</h2>
          <div className="text-6xl font-extrabold font-cairo text-gradient-gold my-4">
            {overallProgress}%
          </div>
          <p className="text-[var(--color-text)] font-cairo text-lg">
            لقد حفظت <span className="text-secondary font-bold">{totalVerifiedAyahs}</span> آية من أصل <span className="text-secondary font-bold">6236</span> آية.
          </p>
        </motion.div>

        {/* Surahs Progress Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="section-title text-xl font-bold font-cairo text-slate-800">تقدم السور</h2>

          {surahsProgress.length === 0 ? (
            <div className="islamic-card p-8 text-center space-y-4">
              <p className="text-[var(--color-text-muted)] font-cairo text-lg">لم تقم بحفظ أي آيات بعد.</p>
              <Link href="/memorize/new" className="btn-gold inline-block">
                ابدأ الحفظ الآن
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {surahsProgress.map((surah) => (
                <motion.div key={surah.surahNumber} variants={itemVariants} className="islamic-card p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-secondary font-cairo">
                      سورة {surah.surahName}
                    </h3>
                    <span className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-text)] px-2.5 py-1 rounded-full font-cairo border border-[var(--color-border)]">
                      {surah.completedAyahs} / {surah.totalAyahs} آية
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${surah.percentage}%` }}
                    />
                  </div>
                  <div className="text-left text-xs text-secondary font-bold font-cairo">
                    {surah.percentage}%
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}