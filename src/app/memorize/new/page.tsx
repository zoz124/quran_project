'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Surah = {
  id: number;
  name: string;
  totalAyahs: number;
};

type ApiSurah = {
  number: number;
  name: string;
  numberOfAyahs: number;
};

export default function NewMemorizePage() {
  const router = useRouter();

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [surahId, setSurahId] = useState('');
  const [fromAyah, setFromAyah] = useState('1');
  const [toAyah, setToAyah] = useState('1');
  const [reciter, setReciter] = useState('mishary');
  const [repeat, setRepeat] = useState('1');

  useEffect(() => {
    let isMounted = true;

    async function loadSurahs() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch(
          'https://api.alquran.cloud/v1/meta',
          { cache: 'force-cache' }
        );

        if (!response.ok) {
          throw new Error('تعذر تحميل قائمة السور من الإنترنت.');
        }

        const result = await response.json();
        const references: ApiSurah[] =
          result?.data?.surahs?.references ?? [];

        const onlineSurahs = references
          .map((surah) => ({
            id: Number(surah.number),
            name: String(surah.name),
            totalAyahs: Number(surah.numberOfAyahs),
          }))
          .filter(
            (surah) =>
              Number.isInteger(surah.id) &&
              surah.id > 0 &&
              Boolean(surah.name) &&
              Number.isInteger(surah.totalAyahs) &&
              surah.totalAyahs > 0
          )
          .sort((a, b) => a.id - b.id);

        if (onlineSurahs.length === 0) {
          throw new Error('لم يتم العثور على بيانات السور.');
        }

        if (isMounted) {
          setSurahs(onlineSurahs);
          setSurahId(String(onlineSurahs[0].id));
          setFromAyah('1');
          setToAyah('1');
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'حدث خطأ أثناء تحميل السور.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSurahs();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSurah = useMemo(
    () => surahs.find((surah) => surah.id === Number(surahId)),
    [surahs, surahId]
  );

  const maxAyahs = selectedSurah?.totalAyahs ?? 1;

  function handleSurahChange(nextSurahId: string) {
    const nextSurah = surahs.find(
      (surah) => surah.id === Number(nextSurahId)
    );

    setSurahId(nextSurahId);
    setFromAyah('1');
    setToAyah(String(nextSurah?.totalAyahs ?? 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedFrom = Number(fromAyah);
    const selectedTo = Number(toAyah);
    const repetitions = Number(repeat);

    if (!selectedSurah) {
      setLoadError('يرجى اختيار السورة أولاً.');
      return;
    }

    if (
      !Number.isInteger(selectedFrom) ||
      !Number.isInteger(selectedTo) ||
      selectedFrom < 1 ||
      selectedTo > selectedSurah.totalAyahs ||
      selectedFrom > selectedTo
    ) {
      setLoadError('يرجى اختيار نطاق آيات صحيح.');
      return;
    }

    if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 20) {
      setLoadError('عدد التكرارات يجب أن يكون بين 1 و20.');
      return;
    }

    const params = new URLSearchParams({
      surah: String(selectedSurah.id),
      from: String(selectedFrom),
      to: String(selectedTo),
      reciter,
      repeat: String(repetitions),
    });

    router.push(`/memorize/preview?${params.toString()}`);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        padding: '2rem 1rem',
        background: '#f8fafc',
        fontFamily: 'sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '2rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '1.7rem' }}>
          إنشاء جلسة حفظ جديدة
        </h1>

        <p style={{ color: '#64748b', lineHeight: 1.8 }}>
          اختر السورة والآيات وطريقة الاستماع، ثم ابدأ جلسة الحفظ.
        </p>

        {isLoading && (
          <p style={{ color: '#047857', fontWeight: 'bold' }}>
            ⏳ جاري تحميل السور من الإنترنت...
          </p>
        )}

        {loadError && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.9rem',
              color: '#991b1b',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
            }}
          >
            ⚠️ {loadError}
          </div>
        )}

        {!isLoading && surahs.length > 0 && (
          <form onSubmit={handleSubmit}>
            <Field label="السورة">
              <select
                value={surahId}
                onChange={(event) => handleSurahChange(event.target.value)}
                style={inputStyle}
              >
                {surahs.map((surah) => (
                  <option key={surah.id} value={surah.id}>
                    {surah.id}. سورة {surah.name} ({surah.totalAyahs} آية)
                  </option>
                ))}
              </select>
            </Field>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
              }}
            >
              <Field label="من الآية">
                <input
                  type="number"
                  min="1"
                  max={maxAyahs}
                  value={fromAyah}
                  onChange={(event) => setFromAyah(event.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label={`إلى الآية (حتى ${maxAyahs})`}>
                <input
                  type="number"
                  min="1"
                  max={maxAyahs}
                  value={toAyah}
                  onChange={(event) => setToAyah(event.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            <Field label="القارئ">
              <select
                value={reciter}
                onChange={(event) => setReciter(event.target.value)}
                style={inputStyle}
              >
                <option value="mishary">مشاري العفاسي</option>
                <option value="minshawi">محمد صديق المنشاوي</option>
                <option value="hussary">محمود خليل الحصري</option>
                <option value="ghamdi">سعد الغامدي</option>
              </select>
            </Field>

            <Field label="عدد مرات تكرار المقطع">
              <input
                type="number"
                min="1"
                max="20"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                style={inputStyle}
              />
            </Field>

            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.9rem 1rem',
                color: '#ffffff',
                background: '#047857',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              بدء جلسة الحفظ ←
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: 'block',
        marginTop: '1rem',
        color: '#334155',
        fontWeight: 'bold',
      }}
    >
      <span style={{ display: 'block', marginBottom: '0.45rem' }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  color: '#1e293b',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  fontSize: '1rem',
  outline: 'none',
} as const;