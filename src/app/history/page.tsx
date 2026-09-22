'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import TasbihLoader from '@/components/ui/TasbihLoader';

interface HistorySession {
  id: string;
  created_at: string;
  surah_number: number;
  surah_name: string;
  start_ayah: number;
  end_ayah: number;
  ayah_count: number;
  accuracy: number;
  type: string;
}

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

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'voice' | 'text' | 'high'>('all');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        const [{ data: sessionsData }, { data: logsData }] = await Promise.all([
          supabase.from('memorization_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('memorization_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        const rawList = [...(sessionsData || []), ...(logsData || [])];

        const formattedList: HistorySession[] = rawList.map((item) => {
          const surahNum = item.surah_number || 1;
          const startAyah = item.start_ayah || 1;
          const endAyah = item.end_ayah || startAyah;
          const ayahCount = item.ayah_count || Math.max(1, endAyah - startAyah + 1);
          const accuracyVal = item.accuracy ?? item.score ?? item.accuracy_percentage ?? 100;

          let sessionType = item.type || item.session_type || item.mode || 'تسميع صوتي';
          if (sessionType === 'voice') sessionType = 'تسميع صوتي';
          if (sessionType === 'text' || sessionType === 'written') sessionType = 'تسميع كتابي';

          return {
            id: item.id || Math.random().toString(),
            created_at: item.created_at,
            surah_number: surahNum,
            surah_name: SURAH_NAMES[surahNum - 1] || `سورة ${surahNum}`,
            start_ayah: startAyah,
            end_ayah: endAyah,
            ayah_count: ayahCount,
            accuracy: Math.min(100, Math.max(0, Math.round(Number(accuracyVal)))),
            type: sessionType,
          };
        });

        formattedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setSessions(formattedList);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalAyahs = sessions.reduce((acc, curr) => acc + curr.ayah_count, 0);
    const avgAccuracy = totalSessions > 0
      ? Math.round(sessions.reduce((acc, curr) => acc + curr.accuracy, 0) / totalSessions)
      : 0;
    return { totalSessions, totalAyahs, avgAccuracy };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = s.surah_name.includes(searchQuery) || s.surah_number.toString().includes(searchQuery);
      if (!matchesSearch) return false;

      if (activeFilter === 'voice') return s.type.includes('صوتي');
      if (activeFilter === 'text') return s.type.includes('كتابي');
      if (activeFilter === 'high') return s.accuracy >= 90;
      return true;
    });
  }, [sessions, searchQuery, activeFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <TasbihLoader size="lg" text="جاري تحميل سجل طريق الرحمة..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">

      {/* هيدر الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-cairo text-[#15261e]">
            سجل الحفظ والتسميع
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-cairo mt-1">
            سجل الجلسات والتسميع القرآني لمتابعة أداء حفظك في طريق الرحمة
          </p>
        </div>

        <Link
          href="/memorize/new"
          className="self-start sm:self-center bg-[#15261e] hover:bg-[#1d3529] text-[#d4af37] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cairo transition-all shadow-sm flex items-center gap-2"
        >
          <span>+</span>
          <span>بدء تسميع جديد</span>
        </Link>
      </div>

      {/* كروت الإحصائيات (تتوزع ديناميكياً) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold font-cairo text-slate-400">إجمالي الجلسات</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#15261e]">{stats.totalSessions}</div>
          <span className="text-[11px] text-emerald-700 font-cairo">جلسات مكتملة</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold font-cairo text-slate-400">إجمالي الآيات</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-cairo text-amber-600">{stats.totalAyahs}</div>
          <span className="text-[11px] text-slate-500 font-cairo">آية مباركة</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold font-cairo text-slate-400">متوسط الصحة</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#15261e]">{stats.avgAccuracy}%</div>
          <span className="text-[11px] text-emerald-700 font-cairo">معدل الدقة العام</span>
        </div>
      </div>

      {/* شريط الفلترة والبحث */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث باسم السورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15261e] font-cairo transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'voice', label: '🎙️ صوتي' },
            { id: 'text', label: '✍️ كتابي' },
            { id: 'high', label: '⭐ ممتاز (+90%)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-cairo transition-all whitespace-nowrap ${activeFilter === tab.id
                  ? 'bg-[#15261e] text-[#d4af37]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* القائمة والمستندات */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <p className="text-slate-500 font-cairo text-sm">لا توجد نتائج مطابقة لمحدادت البحث.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-[#15261e] text-[#d4af37] font-bold font-cairo rounded-xl flex items-center justify-center text-sm shrink-0">
                  {session.surah_number}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold font-cairo text-[#15261e]">
                      سورة {session.surah_name}
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-cairo border border-slate-200">
                      {session.type}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-cairo flex items-center gap-2 flex-wrap">
                    <span>الآيات: {session.start_ayah} - {session.end_ayah} ({session.ayah_count} آية)</span>
                    <span>•</span>
                    <span>{formatDate(session.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* شريط نسبة الصحة الدقيق */}
              <div className="flex items-center gap-4 self-end sm:self-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-left space-y-1">
                  <div className="text-xs font-bold font-cairo text-slate-600">
                    الدقة: <span className="text-[#15261e] font-extrabold">{session.accuracy}%</span>
                  </div>
                  <div className="w-24 sm:w-28 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${session.accuracy >= 90 ? 'bg-emerald-600' : session.accuracy >= 75 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${session.accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}