'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import TasbihLoader from '@/components/ui/TasbihLoader';

// خريطة تقسيم الأجزاء والسور والآيات الخمسين الأولى كمثال للتقسيم الدقيق
const JUZ_MAPPING: Record<number, { surahs: { surah_number: number; name: string; start_ayah: number; end_ayah: number }[] }> = {
  1: { surahs: [{ surah_number: 1, name: 'الفاتحة', start_ayah: 1, end_ayah: 7 }, { surah_number: 2, name: 'البقرة', start_ayah: 1, end_ayah: 141 }] },
  2: { surahs: [{ surah_number: 2, name: 'البقرة', start_ayah: 142, end_ayah: 252 }] },
  3: { surahs: [{ surah_number: 2, name: 'البقرة', start_ayah: 253, end_ayah: 286 }, { surah_number: 3, name: 'آل عمران', start_ayah: 1, end_ayah: 92 }] },
  4: { surahs: [{ surah_number: 3, name: 'آل عمران', start_ayah: 93, end_ayah: 200 }, { surah_number: 4, name: 'النساء', start_ayah: 1, end_ayah: 23 }] },
  5: { surahs: [{ surah_number: 4, name: 'النساء', start_ayah: 24, end_ayah: 147 }] },
  6: { surahs: [{ surah_number: 4, name: 'النساء', start_ayah: 148, end_ayah: 176 }, { surah_number: 5, name: 'المائدة', start_ayah: 1, end_ayah: 81 }] },
  7: { surahs: [{ surah_number: 5, name: 'المائدة', start_ayah: 82, end_ayah: 120 }, { surah_number: 6, name: 'الأنعام', start_ayah: 1, end_ayah: 110 }] },
  8: { surahs: [{ surah_number: 6, name: 'الأنعام', start_ayah: 111, end_ayah: 165 }, { surah_number: 7, name: 'الأعراف', start_ayah: 1, end_ayah: 87 }] },
  9: { surahs: [{ surah_number: 7, name: 'الأعراف', start_ayah: 88, end_ayah: 206 }, { surah_number: 8, name: 'الأنفال', start_ayah: 1, end_ayah: 40 }] },
  10: { surahs: [{ surah_number: 8, name: 'الأنفال', start_ayah: 41, end_ayah: 75 }, { surah_number: 9, name: 'التوبة', start_ayah: 1, end_ayah: 92 }] },
  11: { surahs: [{ surah_number: 9, name: 'التوبة', start_ayah: 93, end_ayah: 129 }, { surah_number: 10, name: 'يونس', start_ayah: 1, end_ayah: 109 }, { surah_number: 11, name: 'هود', start_ayah: 1, end_ayah: 5 }] },
  12: { surahs: [{ surah_number: 11, name: 'هود', start_ayah: 6, end_ayah: 123 }, { surah_number: 12, name: 'يوسف', start_ayah: 1, end_ayah: 52 }] },
  13: { surahs: [{ surah_number: 12, name: 'يوسف', start_ayah: 53, end_ayah: 111 }, { surah_number: 13, name: 'الرعد', start_ayah: 1, end_ayah: 43 }, { surah_number: 14, name: 'إبراهيم', start_ayah: 1, end_ayah: 52 }] },
  14: { surahs: [{ surah_number: 15, name: 'الحجر', start_ayah: 1, end_ayah: 99 }, { surah_number: 16, name: 'النحل', start_ayah: 1, end_ayah: 128 }] },
  15: { surahs: [{ surah_number: 17, name: 'الإسراء', start_ayah: 1, end_ayah: 111 }, { surah_number: 18, name: 'الكهف', start_ayah: 1, end_ayah: 74 }] },
  16: { surahs: [{ surah_number: 18, name: 'الكهف', start_ayah: 75, end_ayah: 110 }, { surah_number: 19, name: 'مريم', start_ayah: 1, end_ayah: 98 }, { surah_number: 20, name: 'طه', start_ayah: 1, end_ayah: 135 }] },
  17: { surahs: [{ surah_number: 21, name: 'الأنبياء', start_ayah: 1, end_ayah: 112 }, { surah_number: 22, name: 'الحج', start_ayah: 1, end_ayah: 78 }] },
  18: { surahs: [{ surah_number: 23, name: 'المؤمنون', start_ayah: 1, end_ayah: 118 }, { surah_number: 24, name: 'النور', start_ayah: 1, end_ayah: 64 }, { surah_number: 25, name: 'الفرقان', start_ayah: 1, end_ayah: 20 }] },
  19: { surahs: [{ surah_number: 25, name: 'الفرقان', start_ayah: 21, end_ayah: 77 }, { surah_number: 26, name: 'الشعراء', start_ayah: 1, end_ayah: 227 }, { surah_number: 27, name: 'النمل', start_ayah: 1, end_ayah: 55 }] },
  20: { surahs: [{ surah_number: 27, name: 'النمل', start_ayah: 56, end_ayah: 93 }, { surah_number: 28, name: 'القصص', start_ayah: 1, end_ayah: 88 }, { surah_number: 29, name: 'العنكبوت', start_ayah: 1, end_ayah: 45 }] },
  21: { surahs: [{ surah_number: 29, name: 'العنكبوت', start_ayah: 46, end_ayah: 69 }, { surah_number: 30, name: 'الروم', start_ayah: 1, end_ayah: 60 }, { surah_number: 31, name: 'لقمان', start_ayah: 1, end_ayah: 34 }, { surah_number: 32, name: 'السجدة', start_ayah: 1, end_ayah: 30 }, { surah_number: 33, name: 'الأحزاب', start_ayah: 1, end_ayah: 30 }] },
  22: { surahs: [{ surah_number: 33, name: 'الأحزاب', start_ayah: 31, end_ayah: 73 }, { surah_number: 34, name: 'سبأ', start_ayah: 1, end_ayah: 54 }, { surah_number: 35, name: 'فاطر', start_ayah: 1, end_ayah: 45 }, { surah_number: 36, name: 'يس', start_ayah: 1, end_ayah: 27 }] },
  23: { surahs: [{ surah_number: 36, name: 'يس', start_ayah: 28, end_ayah: 83 }, { surah_number: 37, name: 'الصافات', start_ayah: 1, end_ayah: 182 }, { surah_number: 38, name: 'ص', start_ayah: 1, end_ayah: 88 }, { surah_number: 39, name: 'الزمر', start_ayah: 1, end_ayah: 31 }] },
  24: { surahs: [{ surah_number: 39, name: 'الزمر', start_ayah: 32, end_ayah: 75 }, { surah_number: 40, name: 'غافر', start_ayah: 1, end_ayah: 85 }, { surah_number: 41, name: 'فصلت', start_ayah: 1, end_ayah: 46 }] },
  25: { surahs: [{ surah_number: 41, name: 'فصلت', start_ayah: 47, end_ayah: 54 }, { surah_number: 42, name: 'الشورى', start_ayah: 1, end_ayah: 53 }, { surah_number: 43, name: 'الزخرف', start_ayah: 1, end_ayah: 89 }, { surah_number: 44, name: 'الدخان', start_ayah: 1, end_ayah: 59 }, { surah_number: 45, name: 'الجاثية', start_ayah: 1, end_ayah: 37 }] },
  26: { surahs: [{ surah_number: 46, name: 'الأحقاف', start_ayah: 1, end_ayah: 35 }, { surah_number: 47, name: 'محمد', start_ayah: 1, end_ayah: 38 }, { surah_number: 48, name: 'الفتح', start_ayah: 1, end_ayah: 29 }, { surah_number: 49, name: 'الحجرات', start_ayah: 1, end_ayah: 18 }, { surah_number: 50, name: 'ق', start_ayah: 1, end_ayah: 45 }, { surah_number: 51, name: 'الذاريات', start_ayah: 1, end_ayah: 30 }] },
  27: { surahs: [{ surah_number: 51, name: 'الذاريات', start_ayah: 31, end_ayah: 60 }, { surah_number: 52, name: 'الطور', start_ayah: 1, end_ayah: 49 }, { surah_number: 53, name: 'النجم', start_ayah: 1, end_ayah: 62 }, { surah_number: 54, name: 'القمر', start_ayah: 1, end_ayah: 55 }, { surah_number: 55, name: 'الرحمن', start_ayah: 1, end_ayah: 78 }, { surah_number: 56, name: 'الواقعة', start_ayah: 1, end_ayah: 96 }, { surah_number: 57, name: 'الحديد', start_ayah: 1, end_ayah: 29 }] },
  28: { surahs: [{ surah_number: 58, name: 'المجادلة', start_ayah: 1, end_ayah: 22 }, { surah_number: 66, name: 'التحريم', start_ayah: 1, end_ayah: 12 }] },
  29: { surahs: [{ surah_number: 67, name: 'الملك', start_ayah: 1, end_ayah: 30 }, { surah_number: 77, name: 'المرسلات', start_ayah: 1, end_ayah: 50 }] },
  30: { surahs: [{ surah_number: 78, name: 'النبأ', start_ayah: 1, end_ayah: 40 }, { surah_number: 114, name: 'الناس', start_ayah: 1, end_ayah: 6 }] },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function JuzDetailPage() {
  const params = useParams();
  const router = useRouter();
  const juzId = Number(params?.id) || 1;

  const [loading, setLoading] = useState(true);
  const [totalJuzAyahs, setTotalJuzAyahs] = useState(0);
  const [verifiedAyahsCount, setVerifiedAyahsCount] = useState(0);
  const [surahDetails, setSurahDetails] = useState<any[]>([]);

  useEffect(() => {
    async function fetchJuzProgress() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const userId = session.user.id;
        const juzInfo = JUZ_MAPPING[juzId] || JUZ_MAPPING[1];

        const [{ data: logs }, { data: sessions }] = await Promise.all([
          supabase.from('memorization_logs').select('*').eq('user_id', userId),
          supabase.from('memorization_sessions').select('*').eq('user_id', userId),
        ]);

        const allLogs = logs || [];
        const allSessions = sessions || [];

        const memorizedAyahsSet = new Set<string>();

        allLogs.forEach((log) => {
          if (log.start_ayah && log.end_ayah) {
            for (let a = log.start_ayah; a <= log.end_ayah; a++) {
              memorizedAyahsSet.add(`${log.surah_number}:${a}`);
            }
          }
        });

        allSessions.forEach((s) => {
          if (s.start_ayah && s.end_ayah) {
            for (let a = s.start_ayah; a <= s.end_ayah; a++) {
              memorizedAyahsSet.add(`${s.surah_number}:${a}`);
            }
          }
        });

        let juzAyahTotal = 0;
        let juzVerifiedTotal = 0;

        const surahBreakdown = juzInfo.surahs.map((surah) => {
          const surahTotalAyahs = surah.end_ayah - surah.start_ayah + 1;
          let surahVerified = 0;

          for (let a = surah.start_ayah; a <= surah.end_ayah; a++) {
            if (memorizedAyahsSet.has(`${surah.surah_number}:${a}`)) {
              surahVerified++;
            }
          }

          juzAyahTotal += surahTotalAyahs;
          juzVerifiedTotal += surahVerified;

          return {
            ...surah,
            totalAyahs: surahTotalAyahs,
            verifiedAyahs: surahVerified,
            progress: Math.min(100, Math.round((surahVerified / surahTotalAyahs) * 100)),
          };
        });

        setTotalJuzAyahs(juzAyahTotal);
        setVerifiedAyahsCount(juzVerifiedTotal);
        setSurahDetails(surahBreakdown);

      } catch (err) {
        console.error('Error fetching juz progress:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJuzProgress();
  }, [juzId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9]">
        <TasbihLoader size="lg" text={`جاري تحميل تفاصيل الجزء ${juzId}...`} />
      </div>
    );
  }

  const overallJuzPercent = totalJuzAyahs > 0 ? Math.min(100, Math.round((verifiedAyahsCount / totalJuzAyahs) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9] p-6 md:p-8">
      <motion.div
        className="max-w-4xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Navigation / Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-secondary hover:underline font-cairo font-bold"
          >
            ← العودة للوحة التحكم
          </Link>
          <span className="text-[var(--color-text-muted)] font-cairo text-sm">تفاصيل الإنجاز</span>
        </motion.div>

        {/* Hero Card */}
        <motion.div variants={itemVariants} className="islamic-card islamic-border p-8 text-center space-y-4">
          <h1 className="text-3xl font-bold font-cairo text-gradient-gold">الجزء {juzId}</h1>
          <p className="text-[var(--color-text)] font-cairo">
            تم حفظ <span className="text-secondary font-bold">{verifiedAyahsCount}</span> من أصل <span className="text-secondary font-bold">{totalJuzAyahs}</span> آية
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-sm font-cairo text-[var(--color-text-muted)]">
              <span>نسبة إنجاز الجزء</span>
              <span className="font-bold text-secondary">{overallJuzPercent}%</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className={`progress-bar-fill ${overallJuzPercent === 100 ? 'complete' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${overallJuzPercent}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Surahs Breakdown List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="section-title">السور في هذا الجزء</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surahDetails.map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="islamic-card p-5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-secondary font-cairo">سورة {s.name}</h3>
                  <span className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-text)] px-2.5 py-1 rounded-full font-cairo border border-[var(--color-border)]">
                    {s.verifiedAyahs} / {s.totalAyahs} آية
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${s.progress === 100 ? 'complete' : ''}`}
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-cairo">
                  <span>الآيات ({s.start_ayah} - {s.end_ayah})</span>
                  <span className="text-secondary font-bold">{s.progress}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}