'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import TasbihLoader from '@/components/ui/TasbihLoader';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export default function JuzProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const juzId = parseInt(resolvedParams.id, 10);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function loadJuzData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: sessions } = await supabase
          .from('memorization_sessions')
          .select('*')
          .eq('user_id', session.user.id);

        if (sessions) {
          const TOTAL_QURAN_AYAHS = 6236;
          const avgAyahsPerJuz = TOTAL_QURAN_AYAHS / 30;
          const totalAyahs = sessions.reduce((acc, s) => acc + (s.completed_ayahs || 0), 0);
          const ayahsForThisJuz = Math.max(0, Math.min(avgAyahsPerJuz, totalAyahs - ((juzId - 1) * avgAyahsPerJuz)));
          const computed = Math.min(100, Math.round((ayahsForThisJuz / avgAyahsPerJuz) * 100));
          setProgress(computed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadJuzData();
  }, [juzId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9]">
        <TasbihLoader size="lg" text={`جاري تحميل تفاصيل الجزء ${juzId}...`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9] p-6 md:p-8" dir="rtl">
      <motion.div
        className="max-w-4xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">تفاصيل الجزء {juzId} 📖</h1>
          <Link href="/dashboard" className="text-emerald-800 hover:underline text-sm font-semibold">
            ← العودة للوحة التحكم
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-2xl shadow-lg">
            {juzId}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">نسبة الإنجاز في الجزء {juzId}</h2>
          <p className="text-4xl font-extrabold text-emerald-800 my-4">{progress}%</p>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200 max-w-md mx-auto">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}