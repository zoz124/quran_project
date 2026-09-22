'use client';

import { useRouter, useSearchParams } from 'next/navigation';

// داخل مكون MemorizeContent:
const router = useRouter();

import { Suspense, use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type Ayah = {
  numberInSurah: number;
  text: string;
  tafseer: string;
  audio: string;
};

type Session = {
  id?: string;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  sheikh_repetitions?: number;
};

type Stage = 'Sheikh' | 'UserRecite' | 'Result';
type TestMode = 'voice' | 'write';
type WordCheck = { word: string; matched: boolean };

function cleanArabicText(text: string) {
  return String(text || '')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/[^\u0621-\u064A\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordSimilarity(first: string, second: string) {
  if (first === second) return 1;
  if (!first || !second) return 0;

  const matrix = Array.from({ length: first.length + 1 }, () =>
    Array(second.length + 1).fill(0)
  );

  for (let i = 0; i <= first.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= second.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= first.length; i++) {
    for (let j = 1; j <= second.length; j++) {
      const cost = first[i - 1] === second[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return 1 - matrix[first.length][second.length] / Math.max(first.length, second.length);
}

function alignWords(expectedWords: string[], actualWords: string[]) {
  let actualCursor = 0;

  return expectedWords.map((word) => {
    const target = cleanArabicText(word);
    let bestIndex = -1;
    let bestScore = 0;

    for (
      let index = actualCursor;
      index < Math.min(actualCursor + 4, actualWords.length);
      index++
    ) {
      const score = wordSimilarity(target, actualWords[index]);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    if (bestScore >= 0.82) {
      actualCursor = bestIndex + 1;
      return true;
    }

    return false;
  });
}

function getAudioUrl(surah: number, ayah: number, reciter: string) {
  const fileName = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;

  const folders: Record<string, string> = {
    mishary: 'Alafasy_128kbps',
    minshawi: 'Minshawy_Murattal_128kbps',
    hussary: 'Husary_128kbps',
    ghamdi: 'Ghamadi_40kbps',
  };

  return `https://everyayah.com/data/${folders[reciter] || folders.mishary}/${fileName}`;
}

function isUuid(value?: string) {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remaining}`;
}

function MemorizeContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();

  const surahNumber = Number(searchParams.get('surah') || 1);
  const startAyah = Number(searchParams.get('from') || 1);
  const endAyah = Number(searchParams.get('to') || 7);
  const reciter = searchParams.get('reciter') || 'mishary';
  const repetitions = Math.max(1, Number(searchParams.get('repeat') || 1));

  const [session, setSession] = useState<Session | null>(null);
  const [surahName, setSurahName] = useState('');
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>('Sheikh');
  const [testMode, setTestMode] = useState<TestMode>('write');
  const [testScope, setTestScope] = useState<'full' | 'single'>('full');
  const [selectedTestAyahIndex, setSelectedTestAyahIndex] = useState(0);

  // حالة إخفاء القرآن لأغراض التسميع من الحفظ
  const [isQuranVisible, setIsQuranVisible] = useState<boolean>(true);

  // الآية النشطة لعرض التفسير
  const [activeAyahForTafseer, setActiveAyahForTafseer] = useState<number>(0);

  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1);

  const [writtenText, setWrittenText] = useState('');
  const [spokenText, setSpokenText] = useState('');
  const [wordAnalysis, setWordAnalysis] = useState<Record<number, WordCheck[]>>({});
  const [ayahAccuracy, setAyahAccuracy] = useState<Record<number, number>>({});
  const [verifiedAyahNumbers, setVerifiedAyahNumbers] = useState<number[]>([]);
  const [revealedHintWordsCount, setRevealedHintWordsCount] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setFetchError(null);

        if (
          !Number.isInteger(surahNumber) ||
          surahNumber < 1 ||
          surahNumber > 114 ||
          startAyah < 1 ||
          endAyah < startAyah
        ) {
          throw new Error('بيانات السورة أو نطاق الآيات غير صحيحة.');
        }

        let loadedSession: Session = {
          surah_number: surahNumber,
          start_ayah: startAyah,
          end_ayah: endAyah,
          sheikh_repetitions: repetitions,
        };

        if (isUuid(resolvedParams.id)) {
          const { data } = await supabase
            .from('memorization_sessions')
            .select('*')
            .eq('id', resolvedParams.id)
            .maybeSingle();

          if (data?.id) {
            loadedSession = { ...loadedSession, id: data.id };
          }
        }

        const [quranResponse, tafseerResponse] = await Promise.all([
          fetch(
            `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`,
            { cache: 'force-cache' }
          ),
          fetch(
            `https://api.alquran.cloud/v1/surah/${surahNumber}/ar.muyassar`,
            { cache: 'force-cache' }
          ),
        ]);

        if (!quranResponse.ok) {
          throw new Error('تعذر تحميل السورة من خدمة القرآن الإلكترونية.');
        }

        const quran = await quranResponse.json();
        const tafseer = tafseerResponse.ok ? await tafseerResponse.json() : null;

        const tafseerMap = new Map<number, string>(
          (tafseer?.data?.ayahs || []).map((ayah: any) => [
            Number(ayah.numberInSurah),
            String(ayah.text || ''),
          ])
        );

        const loadedAyahs: Ayah[] = (quran?.data?.ayahs || [])
          .map((ayah: any) => {
            const ayahNumber = Number(ayah.numberInSurah);

            return {
              numberInSurah: ayahNumber,
              text: String(ayah.text || ''),
              tafseer:
                tafseerMap.get(ayahNumber) ||
                'التفسير الميسر غير متوفر لهذه الآية.',
              audio: getAudioUrl(surahNumber, ayahNumber, reciter),
            };
          })
          .filter(
            (ayah: Ayah) =>
              ayah.numberInSurah >= startAyah &&
              ayah.numberInSurah <= endAyah
          );

        if (!loadedAyahs.length) {
          throw new Error('لم يتم العثور على آيات ضمن النطاق المختار.');
        }

        if (!cancelled) {
          setSession(loadedSession);
          setSurahName(String(quran?.data?.name || ''));
          setAyahs(loadedAyahs);
          setCurrentAyahIndex(0);
          setCurrentRepeat(1);
          setWrittenText('');
          setSpokenText('');
          setWordAnalysis({});
          setAyahAccuracy({});
          setVerifiedAyahNumbers([]);
          setRevealedHintWordsCount(0);
          setHasChecked(false);
        }
      } catch (error) {
        if (!cancelled) {
          setFetchError(
            error instanceof Error
              ? error.message
              : 'حدث خطأ أثناء تحميل السورة.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [
    surahNumber,
    startAyah,
    endAyah,
    repetitions,
    reciter,
    resolvedParams.id,
  ]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // التحكم في إخفاء الآيات عند الدخول لوضع التسميع
  useEffect(() => {
    if (stage === 'UserRecite' && testMode === 'write') {
      setIsQuranVisible(false);
    } else {
      setIsQuranVisible(true);
    }
  }, [stage, testMode]);

  // تحديث التفسير النشط
  useEffect(() => {
    if (stage === 'Sheikh' && ayahs[currentAyahIndex]) {
      setActiveAyahForTafseer(currentAyahIndex);
    }
  }, [currentAyahIndex, stage, ayahs]);

  useEffect(() => {
    if (stage === 'UserRecite' && testScope === 'single') {
      setActiveAyahForTafseer(selectedTestAyahIndex);
    }
  }, [selectedTestAyahIndex, testScope, stage]);

  useEffect(() => {
    setWrittenText('');
    setSpokenText('');
    setRevealedHintWordsCount(0);
  }, [testScope, selectedTestAyahIndex]);

  function evaluateText(input: string) {
    const actualWords = cleanArabicText(input).split(' ').filter(Boolean);

    if (!actualWords.length) return;

    const targetAyahs =
      testScope === 'single' ? [ayahs[selectedTestAyahIndex]] : ayahs;

    const nextAnalysis = { ...wordAnalysis };
    const nextAccuracy = { ...ayahAccuracy };
    const nextVerified = [...verifiedAyahNumbers];

    const wordsByAyah = targetAyahs.map((ayah) =>
      ayah.text.split(/\s+/).filter(Boolean)
    );
    const matchedFlags = alignWords(wordsByAyah.flat(), actualWords);

    let cursor = 0;

    targetAyahs.forEach((ayah, index) => {
      const words = wordsByAyah[index];
      const flags = matchedFlags.slice(cursor, cursor + words.length);
      cursor += words.length;

      const accuracy = Math.round(
        (flags.filter(Boolean).length / Math.max(1, words.length)) * 100
      );

      nextAnalysis[ayah.numberInSurah] = words.map((word, wordIndex) => ({
        word,
        matched: flags[wordIndex],
      }));

      nextAccuracy[ayah.numberInSurah] = accuracy;

      if (accuracy === 100) {
        if (!nextVerified.includes(ayah.numberInSurah)) {
          nextVerified.push(ayah.numberInSurah);
        }
      } else {
        const idx = nextVerified.indexOf(ayah.numberInSurah);
        if (idx !== -1) {
          nextVerified.splice(idx, 1);
        }
      }
    });

    setWordAnalysis(nextAnalysis);
    setAyahAccuracy(nextAccuracy);
    setVerifiedAyahNumbers(nextVerified);
    setHasChecked(true);
    setErrorMessage(null);
  }

  function handleLiveWrittenText(value: string) {
    setWrittenText(value);

    if (!value.trim()) {
      if (testScope === 'single') {
        const currentTargetNum = ayahs[selectedTestAyahIndex]?.numberInSurah;
        if (currentTargetNum) {
          setWordAnalysis((prev) => {
            const copy = { ...prev };
            delete copy[currentTargetNum];
            return copy;
          });
          setAyahAccuracy((prev) => {
            const copy = { ...prev };
            delete copy[currentTargetNum];
            return copy;
          });
          setVerifiedAyahNumbers((prev) =>
            prev.filter((num) => num !== currentTargetNum)
          );
        }
      } else {
        setWordAnalysis({});
        setAyahAccuracy({});
        setVerifiedAyahNumbers([]);
        setHasChecked(false);
      }
      return;
    }

    evaluateText(value);
  }

  function showNextWordHint() {
    const targetAyah =
      testScope === 'single'
        ? ayahs[selectedTestAyahIndex]
        : ayahs.find((ayah) => (ayahAccuracy[ayah.numberInSurah] || 0) < 100) ||
        ayahs[0];

    if (!targetAyah) return;

    const words = targetAyah.text.split(/\s+/).filter(Boolean);
    if (revealedHintWordsCount < words.length) {
      const nextWord = words[revealedHintWordsCount];
      setWrittenText((prev) => (prev ? `${prev.trim()} ${nextWord}` : nextWord));
      setRevealedHintWordsCount((count) => count + 1);
      setTimeout(() => {
        evaluateText(writtenText ? `${writtenText.trim()} ${nextWord}` : nextWord);
      }, 50);
    }
  }

  async function startRecording() {
    try {
      setErrorMessage(null);
      setSpokenText('');
      setRecordingSeconds(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        if (timerRef.current) clearInterval(timerRef.current);

        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        try {
          const formData = new FormData();

          formData.append(
            'file',
            new File([audioBlob], 'quran-recitation.webm', {
              type: recorder.mimeType || 'audio/webm',
            })
          );

          const targetAyahs =
            testScope === 'single'
              ? [ayahs[selectedTestAyahIndex]]
              : ayahs;

          formData.append(
            'prompt',
            targetAyahs.map((ayah) => ayah.text).join(' ')
          );

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok || !data?.text) {
            throw new Error(data?.error || 'فشل تحليل التسجيل الصوتي.');
          }

          setSpokenText(data.text);
          evaluateText(data.text);
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : 'تعذر تحليل التسجيل.'
          );
        } finally {
          setIsAnalyzing(false);
        }
      };

      recorder.start(250);
      recorderRef.current = recorder;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((value) => value + 1);
      }, 1000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `تعذر فتح الميكروفون: ${error.message}`
          : 'تعذر فتح الميكروفون.'
      );
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') {
      setIsRecording(false);
      setIsAnalyzing(true);
      recorderRef.current.stop();
    }
  }

  function handleAudioEnded() {
    if (currentAyahIndex < ayahs.length - 1) {
      setCurrentAyahIndex((index) => index + 1);
      return;
    }

    if (currentRepeat < repetitions) {
      setCurrentRepeat((count) => count + 1);
      setCurrentAyahIndex(0);
      return;
    }

    setStage('UserRecite');
  }

  function retryTest() {
    setWrittenText('');
    setSpokenText('');
    setWordAnalysis({});
    setAyahAccuracy({});
    setVerifiedAyahNumbers([]);
    setRevealedHintWordsCount(0);
    setHasChecked(false);
    setErrorMessage(null);
    setStage('UserRecite');
  }

  const overallAccuracy = ayahs.length
    ? Math.round(
      ayahs.reduce(
        (total, ayah) => total + (ayahAccuracy[ayah.numberInSurah] || 0),
        0
      ) / ayahs.length
    )
    : 0;

  const canFinishSession = overallAccuracy >= 75;

  async function finishSession() {
    if (!canFinishSession) {
      setErrorMessage(
        `لا يمكن إنهاء الجلسة قبل الوصول إلى 75%. نسبتك الحالية ${overallAccuracy}%.`
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      // 1. جلب بيانات المستخدم الحالية من Supabase
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage('عفواً، يجب تسجيل الدخول لحفظ التقدم.');
        setIsAnalyzing(false);
        return;
      }

      // 2. تجهيز بيانات الجلسة للحفظ
      const sessionPayload = {
        user_id: user.id,
        surah_number: surahNumber,
        start_ayah: startAyah,
        end_ayah: endAyah,
        completed_ayahs: verifiedAyahNumbers.length,
        status: verifiedAyahNumbers.length === ayahs.length ? 'completed' : 'in_progress',
        updated_at: new Date().toISOString(),
      };

      if (session?.id) {
        // إذا كان هناك جلسة مسجلة مسبقاً، قم بتحديثها
        const { error } = await supabase
          .from('memorization_sessions')
          .update(sessionPayload)
          .eq('id', session.id);

        if (error) throw error;
      } else {
        // إذا كانت جلسة جديدة، قم بإنشائها داخل جدول الجلسات
        const { data, error } = await supabase
          .from('memorization_sessions')
          .insert([{ ...sessionPayload, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) throw error;

        if (data?.id) {
          setSession((prev) => (prev ? { ...prev, id: data.id } : null));
        }
      }

      // 3. تحديث الكاش لكي تظهر البيانات فوراً في الداشبورد والبروجرس
      router.refresh();

      // 4. الانتقال لشاشة النتيجة
      setStage('Result');
    } catch (error) {
      console.error('Error saving session:', error);
      setErrorMessage('تعذر حفظ نتيجة الجلسة في قاعدة البيانات.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (loading) {
    return <PageMessage message="⏳ جاري تحميل آيات السورة والتفسير الميسر..." />;
  }

  if (fetchError) {
    return <PageMessage message={`⚠️ ${fetchError}`} error />;
  }

  const currentAyah = ayahs[currentAyahIndex];
  const verifiedCount = verifiedAyahNumbers.length;
  const tafseerAyah = ayahs[activeAyahForTafseer] || ayahs[0];

  const currentTestAyah = ayahs[selectedTestAyahIndex];
  const currentSingleAccuracy = currentTestAyah
    ? ayahAccuracy[currentTestAyah.numberInSurah] || 0
    : 0;

  return (
    <main style={pageStyle} dir="rtl">
      <div style={containerStyle}>

        {/* الهيدر العلوي */}
        <header style={headerStyle}>
          <div>
            <h1 style={{ margin: 0, color: '#065f46', fontSize: '1.6rem', fontWeight: 800 }}>
              سورة {surahName.replace(/^سُورَةُ?\s*/i, '')}
            </h1>
            <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              الآيات من <strong style={{ color: '#047857' }}>{startAyah}</strong> إلى <strong style={{ color: '#047857' }}>{endAyah}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={progressBadgeStyle}>
              ✨ إتقان {verifiedCount} من {ayahs.length} آيات
            </span>
          </div>
        </header>

        {errorMessage && <p style={errorStyle}>⚠️ {errorMessage}</p>}

        {/* الشبكة الرئيسية: الجهة اليمنى (التسميع والتفسير)، الجهة اليسرى (القرآن الشريف) */}
        <div style={mainGridStyle}>

          {/* =========================================================
              العمود الأول (اليمين): لوحة التسميع والتفسير الميسر
             ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* 1. مرحلة استماع التلاوة */}
            {stage === 'Sheikh' && currentAyah && (
              <section style={controlCardStyle}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <span style={sheikhBadgeStyle}>🎧 تلاوة تعليمية</span>
                  <p style={{ margin: '0.5rem 0 0', color: '#475569', fontSize: '0.95rem' }}>
                    الآية <strong>{currentAyah.numberInSurah}</strong> — التكرار <strong>{currentRepeat}</strong> من {repetitions}
                  </p>
                </div>

                <audio
                  key={currentAyah.audio}
                  ref={audioRef}
                  src={currentAyah.audio}
                  controls
                  autoPlay
                  onEnded={handleAudioEnded}
                  style={{ width: '100%', maxWidth: '480px', borderRadius: '30px' }}
                />

                <div style={{ marginTop: '1.25rem' }}>
                  <button onClick={() => setStage('UserRecite')} style={primaryButtonStyle}>
                    الانتقال لتسميع الحفظ 🎯
                  </button>
                </div>
              </section>
            )}

            {/* 2. مرحلة التسميع والاختبارات الفاخرة */}
            {stage === 'UserRecite' && (
              <section style={controlCardStyle}>

                {/* أ. نطاق الاختبار (المقطع كاملاً / آية محددة) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={sectionTitleStyle}>1. اختر نطاق التسميع:</span>
                  <div style={scopeGridStyle}>
                    <button
                      onClick={() => setTestScope('full')}
                      style={testScope === 'full' ? activeScopeCardStyle : inactiveScopeCardStyle}
                    >
                      <span style={{ fontSize: '1.3rem' }}>📚</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>المقطع كاملًا</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>من الآية {startAyah} إلى {endAyah}</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setTestScope('single')}
                      style={testScope === 'single' ? activeScopeCardStyle : inactiveScopeCardStyle}
                    >
                      <span style={{ fontSize: '1.3rem' }}>🎯</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>آية واحدة</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>اختبار آية محددة</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* أزرار اختيار الآية عند التسميع المنفرد */}
                {testScope === 'single' && (
                  <div style={ayahPickerBoxStyle}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>حدد الآية:</span>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {ayahs.map((ayah, index) => {
                        const isVerified = verifiedAyahNumbers.includes(ayah.numberInSurah);
                        const isSelected = selectedTestAyahIndex === index;

                        return (
                          <button
                            key={ayah.numberInSurah}
                            onClick={() => setSelectedTestAyahIndex(index)}
                            style={{
                              ...ayahChipStyle,
                              background: isSelected
                                ? '#059669'
                                : isVerified
                                  ? '#ecfdf5'
                                  : '#ffffff',
                              color: isSelected
                                ? '#ffffff'
                                : isVerified
                                  ? '#047857'
                                  : '#334155',
                              borderColor: isSelected
                                ? '#059669'
                                : isVerified
                                  ? '#a7f3d0'
                                  : '#cbd5e1',
                            }}
                          >
                            {isVerified && !isSelected && '✓ '}
                            آية {ayah.numberInSurah}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ب. طريقة التسميع (كتابي / صوتي) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={sectionTitleStyle}>2. طريقة التسميع:</span>
                  <div style={modeGridStyle}>
                    <button
                      onClick={() => setTestMode('write')}
                      style={testMode === 'write' ? activeModeCardStyle : inactiveModeCardStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>✍️</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>تسميع كتابي</div>
                          <div style={{ fontSize: '0.75rem', color: testMode === 'write' ? '#047857' : '#64748b' }}>
                            تصحيح تلقائي فور الطباعة
                          </div>
                        </div>
                      </div>
                      <span style={badgeTagStyle}>موصى به</span>
                    </button>

                    <button
                      onClick={() => setTestMode('voice')}
                      style={testMode === 'voice' ? activeModeCardStyle : inactiveModeCardStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>🎙️</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>تسميع صوتي</div>
                          <div style={{ fontSize: '0.75rem', color: testMode === 'voice' ? '#047857' : '#64748b' }}>
                            تحليل بالذكاء الاصطناعي
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ج. واجهة الكتابة والتسميع */}
                {testMode === 'write' ? (
                  <div style={premiumWriteBoxStyle}>
                    <div style={writeHeaderInfoStyle}>
                      <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>
                        {testScope === 'single'
                          ? `تسميع الآية ${currentTestAyah?.numberInSurah}`
                          : 'تسميع المقطع كاملاً من الحفظ'}
                      </span>

                      {testScope === 'single' && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: currentSingleAccuracy === 100 ? '#059669' : '#d97706' }}>
                          دقة التسميع: {currentSingleAccuracy}%
                        </span>
                      )}
                    </div>

                    <textarea
                      value={writtenText}
                      onChange={(event) => handleLiveWrittenText(event.target.value)}
                      rows={4}
                      placeholder={
                        testScope === 'single'
                          ? `اكتب الآية (${currentTestAyah?.numberInSurah}) هنا من ذاكرتك...`
                          : "اكتب المقطع كاملاً هنا من ذاكرتك..."
                      }
                      style={premiumTextareaStyle}
                    />

                    <div style={writeActionsRowStyle}>
                      <button onClick={showNextWordHint} style={hintButtonStyle}>
                        💡 كشف الكلمة القادمة
                      </button>

                      <button onClick={retryTest} style={clearButtonStyle}>
                        🗑️ مسح الإجابة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem 0' }}>
                    {isRecording && (
                      <div style={recordingPulseStyle}>
                        <span style={redDotStyle} />
                        جاري التسجيل الصوتي: {formatTime(recordingSeconds)}
                      </div>
                    )}

                    {isAnalyzing ? (
                      <p style={{ color: '#047857', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        ⏳ جاري مطابقة التلاوة مع الآيات...
                      </p>
                    ) : (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                          ...primaryButtonStyle,
                          background: isRecording ? '#dc2626' : '#059669',
                          width: '100%',
                          padding: '0.85rem',
                        }}
                      >
                        {isRecording ? '⏹️ إنهاء التسميع وتحليل الصوت' : '🎙️ ابدأ التسميع الصوتي'}
                      </button>
                    )}

                    {spokenText && (
                      <div style={transcriptBoxStyle}>
                        <strong>النص المسموع:</strong> {spokenText}
                      </div>
                    )}
                  </div>
                )}

                {/* زر الإنهاء والحفظ */}
                <button
                  onClick={finishSession}
                  disabled={isAnalyzing || !canFinishSession}
                  style={{
                    ...primaryButtonStyle,
                    width: '100%',
                    marginTop: '1.25rem',
                    background: canFinishSession ? '#047857' : '#94a3b8',
                    opacity: canFinishSession ? 1 : 0.6,
                    cursor: canFinishSession ? 'pointer' : 'not-allowed',
                  }}
                >
                  {canFinishSession
                    ? '✅ حفظ النتيجة وإنهاء التسميع'
                    : `يلزم 75% لإتمام الجلسة — نتيجتك ${overallAccuracy}%`}
                </button>
              </section>
            )}

            {/* 3. شاشة النتيجة النهائية */}
            {stage === 'Result' && (
              <section style={controlCardStyle}>
                <div style={{ fontSize: '2.8rem', marginBottom: '0.25rem' }}>🎉</div>
                <h2 style={{ color: '#065f46', margin: '0 0 0.5rem' }}>
                  {overallAccuracy === 100 ? 'حفظ متقن بامتياز!' : 'نتيجة التسميع'}
                </h2>

                <p style={{ color: '#334155', fontSize: '0.95rem' }}>
                  أتقنت <strong>{verifiedCount}</strong> من <strong>{ayahs.length}</strong> آية بنسبة دقة <strong>{overallAccuracy}%</strong>.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <button onClick={retryTest} style={secondaryButtonStyle}>
                    🔄 إعادة التسميع
                  </button>

                  <Link href="/memorize/new" style={primaryButtonStyle}>
                    جلسة جديدة ➕
                  </Link>
                </div>
              </section>
            )}

            {/* 4. لوحة التفسير الميسر */}
            <aside style={sideTafseerPanelStyle}>
              <div style={tafseerHeaderStyle}>
                <span style={{ fontSize: '1.1rem' }}>📖</span>
                <h3 style={{ margin: 0, color: '#065f46', fontSize: '1rem', fontWeight: 700 }}>
                  التفسير الميسر
                </h3>
              </div>

              <div style={tafseerCardContentStyle}>
                <div style={tafseerAyahNumberBadge}>
                  الآية {tafseerAyah.numberInSurah}
                </div>

                <p style={tafseerAyahTextStyle}>
                  "{tafseerAyah.text}"
                </p>

                <div style={tafseerDividerStyle} />

                <p style={tafseerExplanationStyle}>
                  {tafseerAyah.tafseer}
                </p>
              </div>
            </aside>

          </div>

          {/* =========================================================
              العمود الثاني (اليسار): المصحف الشريف الشامل مع إمكانية الإخفاء
             ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* بطاقة النص القرآني مع خيار الإخفاء للتسميع */}
            <section style={quranCardContainerStyle}>

              {/* شريط أدوات المصحف العلوي */}
              <div style={quranHeaderStyle}>
                <span style={{ fontSize: '0.9rem', color: '#065f46', fontWeight: 700 }}>
                  🕌 المصحف الشريف
                </span>

                <button
                  onClick={() => setIsQuranVisible(!isQuranVisible)}
                  style={toggleQuranButtonStyle}
                  title={isQuranVisible ? "إخفاء النص لتسميع الحفظ" : "إظهار النص للمراجعة"}
                >
                  {isQuranVisible ? '🙈 إخفاء الآيات للتسميع' : '👁️ إظهار الآيات'}
                </button>
              </div>

              {/* النص القرآني متصل ومطابق لمظهر المصحف */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    ...ayahsStyle,
                    filter: isQuranVisible ? 'none' : 'blur(9px)',
                    userSelect: isQuranVisible ? 'text' : 'none',
                    pointerEvents: isQuranVisible ? 'auto' : 'none',
                    opacity: isQuranVisible ? 1 : 0.35,
                    transition: 'all 300ms ease',
                  }}
                >
                  {ayahs.map((ayah, index) => {
                    const analysis = wordAnalysis[ayah.numberInSurah];
                    const verified = verifiedAyahNumbers.includes(
                      ayah.numberInSurah
                    );

                    const isCurrentAyah =
                      stage === 'Sheikh' && index === currentAyahIndex;

                    const isSelectedForTafseer = activeAyahForTafseer === index;

                    return (
                      <span
                        key={ayah.numberInSurah}
                        onClick={() => setActiveAyahForTafseer(index)}
                        title="إضغط لعرض التفسير"
                        style={{
                          display: 'inline',
                          color: '#000000',
                          background: isCurrentAyah
                            ? '#dcfce7'
                            : isSelectedForTafseer
                              ? '#fef3c7'
                              : 'transparent',
                          borderRadius: '6px',
                          boxShadow: isCurrentAyah ? '0 0 0 2px #059669' : 'none',
                          padding: isCurrentAyah ? '0.15rem 0.35rem' : '0 0.1rem',
                          cursor: 'pointer',
                          transition: 'all 180ms ease',
                        }}
                      >
                        {analysis ? (
                          analysis.map((item, wordIndex) => (
                            <span
                              key={`${ayah.numberInSurah}-${wordIndex}`}
                              style={{
                                color: item.matched ? '#0f172a' : '#dc2626',
                                background: item.matched ? 'transparent' : '#fee2e2',
                                textDecoration: item.matched
                                  ? 'none'
                                  : 'underline wavy #dc2626',
                                marginLeft: '0.2rem',
                                padding: '0 0.1rem',
                                borderRadius: '3px',
                              }}
                            >
                              {item.word}{' '}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#0f172a' }}>{ayah.text}{' '}</span>
                        )}

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '1.65rem',
                            height: '1.65rem',
                            margin: '0 0.3rem',
                            color: '#ffffff',
                            background: isCurrentAyah
                              ? '#059669'
                              : verified
                                ? '#10b981'
                                : '#d97706',
                            borderRadius: '50%',
                            fontFamily: 'sans-serif',
                            fontSize: '0.72rem',
                            fontWeight: 'bold',
                            verticalAlign: 'middle',
                            userSelect: 'none',
                          }}
                        >
                          {ayah.numberInSurah}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {/* تراكب تنبيه عند إخفاء الآيات لضمان التسميع النزيه */}
                {!isQuranVisible && (
                  <div style={hiddenQuranOverlayStyle}>
                    <span style={{ fontSize: '2rem' }}>🙈</span>
                    <p style={{ margin: '0.4rem 0', fontWeight: 700, color: '#0f172a' }}>
                      القرآن مخفي لضمان التسميع من الحفظ
                    </p>
                    <button
                      onClick={() => setIsQuranVisible(true)}
                      style={revealOverlayButtonStyle}
                    >
                      👁️ كشف الآيات للمراجعة
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* شريط ملخص الدقة العام */}
            {hasChecked && (
              <div style={summaryCardStyle}>
                <span>دقة المقطع الإجمالية: <strong>{overallAccuracy}%</strong></span>
                <div style={progressBarContainerStyle}>
                  <div style={{ ...progressBarFillStyle, width: `${overallAccuracy}%` }} />
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}

function PageMessage({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        color: error ? '#991b1b' : '#047857',
        background: '#f8fafc',
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
      }}
    >
      {message}
    </main>
  );
}

// ----------------------------------------------------------------
// التنسيقات الفاخرة (Premium UI Layout)
// ----------------------------------------------------------------

const pageStyle = {
  minHeight: '100vh',
  padding: '1.25rem 1rem',
  background: '#f1f5f9',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const containerStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
};

const headerStyle = {
  display: 'flex',
  justifyInContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap' as const,
  marginBottom: '1.25rem',
  padding: '1.1rem 1.5rem',
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
};

const progressBadgeStyle = {
  padding: '0.45rem 0.9rem',
  color: '#047857',
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '999px',
  fontSize: '0.85rem',
  fontWeight: 'bold',
};

// تقسيم الشبكة: العمود الأول (يمين) للتسميع، العمود الثاني (يسار) للقرآن الكريم
const mainGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: '1.25rem',
  alignItems: 'start',
};

const quranCardContainerStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '1.25rem',
  boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
};

const quranHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.75rem',
  marginBottom: '0.75rem',
  borderBottom: '1px solid #f1f5f9',
};

const toggleQuranButtonStyle = {
  padding: '0.4rem 0.8rem',
  color: '#334155',
  background: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const ayahsStyle = {
  padding: '1.25rem',
  color: '#000000',
  background: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '16px',
  fontFamily: 'serif',
  fontSize: 'clamp(1.3rem, 4.2vw, 1.7rem)',
  lineHeight: 2.6,
  textAlign: 'right' as const,
};

const hiddenQuranOverlayStyle = {
  position: 'absolute' as const,
  inset: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(4px)',
  borderRadius: '16px',
  padding: '1rem',
  textAlign: 'center' as const,
};

const revealOverlayButtonStyle = {
  marginTop: '0.5rem',
  padding: '0.5rem 1rem',
  color: '#047857',
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const controlCardStyle = {
  padding: '1.25rem',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
};

const sectionTitleStyle = {
  display: 'block',
  fontSize: '0.88rem',
  color: '#475569',
  fontWeight: 700,
  marginBottom: '0.6rem',
  textAlign: 'right' as const,
};

const scopeGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.6rem',
};

const activeScopeCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.75rem',
  color: '#ffffff',
  background: '#047857',
  border: '1.5px solid #047857',
  borderRadius: '12px',
  cursor: 'pointer',
  textAlign: 'right' as const,
  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)',
};

const inactiveScopeCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.75rem',
  color: '#334155',
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  cursor: 'pointer',
  textAlign: 'right' as const,
};

const ayahPickerBoxStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.4rem',
  marginBottom: '1.25rem',
  padding: '0.65rem',
  background: '#f8fafc',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
};

const ayahChipStyle = {
  padding: '0.3rem 0.65rem',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  borderRadius: '6px',
  border: '1px solid',
  cursor: 'pointer',
};

const modeGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.6rem',
};

const activeModeCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  color: '#047857',
  background: '#ecfdf5',
  border: '1.5px solid #047857',
  borderRadius: '12px',
  cursor: 'pointer',
};

const inactiveModeCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  color: '#64748b',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  cursor: 'pointer',
};

const badgeTagStyle = {
  fontSize: '0.68rem',
  padding: '0.15rem 0.4rem',
  color: '#ffffff',
  background: '#047857',
  borderRadius: '4px',
  fontWeight: 'bold',
};

const premiumWriteBoxStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.65rem',
  marginTop: '0.5rem',
};

const writeHeaderInfoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const premiumTextareaStyle = {
  width: '100%',
  padding: '0.85rem',
  color: '#0f172a',
  background: '#ffffff',
  border: '1.5px solid #cbd5e1',
  borderRadius: '12px',
  direction: 'rtl' as const,
  fontFamily: 'serif',
  fontSize: '1.2rem',
  lineHeight: 1.8,
  outline: 'none',
  resize: 'vertical' as const,
};

const writeActionsRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  justifyContent: 'space-between',
};

const hintButtonStyle = {
  padding: '0.5rem 0.85rem',
  color: '#0369a1',
  background: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  fontSize: '0.82rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const clearButtonStyle = {
  padding: '0.5rem 0.85rem',
  color: '#64748b',
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '0.82rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const recordingPulseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  color: '#dc2626',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '999px',
  fontWeight: 'bold',
  fontSize: '0.85rem',
  marginBottom: '0.75rem',
};

const redDotStyle = {
  width: '8px',
  height: '8px',
  background: '#dc2626',
  borderRadius: '50%',
};

const transcriptBoxStyle = {
  marginTop: '0.75rem',
  padding: '0.75rem',
  color: '#1e293b',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  textAlign: 'right' as const,
  fontSize: '0.9rem',
};

const primaryButtonStyle = {
  display: 'inline-block',
  padding: '0.7rem 1.25rem',
  color: '#ffffff',
  background: '#047857',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  textDecoration: 'none',
  fontWeight: 'bold',
  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)',
};

const secondaryButtonStyle = {
  display: 'inline-block',
  padding: '0.7rem 1.25rem',
  color: '#334155',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const sheikhBadgeStyle = {
  display: 'inline-block',
  padding: '0.2rem 0.65rem',
  color: '#047857',
  background: '#dcfce7',
  borderRadius: '999px',
  fontSize: '0.78rem',
  fontWeight: 'bold',
};

const sideTafseerPanelStyle = {
  padding: '1.1rem',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
};

const tafseerHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  paddingBottom: '0.6rem',
  borderBottom: '1px solid #f1f5f9',
  marginBottom: '0.75rem',
};

const tafseerCardContentStyle = {
  padding: '0.85rem',
  background: '#f8fafc',
  border: '1px solid #f1f5f9',
  borderRadius: '12px',
};

const tafseerAyahNumberBadge = {
  display: 'inline-block',
  padding: '0.15rem 0.5rem',
  color: '#047857',
  background: '#dcfce7',
  borderRadius: '5px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  marginBottom: '0.4rem',
};

const tafseerAyahTextStyle = {
  margin: '0 0 0.5rem',
  color: '#0f172a',
  fontFamily: 'serif',
  fontSize: '1.1rem',
  lineHeight: 1.7,
  fontWeight: 600,
};

const tafseerDividerStyle = {
  height: '1px',
  background: '#e2e8f0',
  margin: '0.6rem 0',
};

const tafseerExplanationStyle = {
  margin: 0,
  color: '#334155',
  fontSize: '0.88rem',
  lineHeight: 1.65,
};

const summaryCardStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.4rem',
  padding: '0.8rem 1rem',
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '12px',
  color: '#047857',
  fontSize: '0.88rem',
  fontWeight: 'bold',
};

const progressBarContainerStyle = {
  height: '7px',
  width: '100%',
  background: '#cbd5e1',
  borderRadius: '999px',
  overflow: 'hidden',
};

const progressBarFillStyle = {
  height: '100%',
  background: '#059669',
  transition: 'width 300ms ease',
};

const errorStyle = {
  padding: '0.7rem 1rem',
  color: '#991b1b',
  background: '#fee2e2',
  borderRadius: '10px',
  marginBottom: '1rem',
  fontSize: '0.88rem',
};

export default function MemorizePage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageMessage message="⏳ جاري فتح جلسة الحفظ..." />}>
      <MemorizeContent {...props} />
    </Suspense>
  );
}