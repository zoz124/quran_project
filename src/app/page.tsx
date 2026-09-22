import Link from 'next/link';

export default function Home() {
  return (
    <main style={pageContainerStyle} dir="rtl">

      {/* خلفية مع لمسات ضوئية ناعمة */}
      <div style={glowTopStyle} />
      <div style={glowBottomStyle} />

      <div style={contentWrapperStyle}>

        {/* شارة التكنولوجيا والذكاء الاصطناعي العلوية */}
        <div style={heroBadgeStyle}>
          <AiSparkleIcon />
          <span>مدعوم بالذكاء الاصطناعي للتصحيح الصوتي اللحظي</span>
        </div>

        {/* العنوان الرئيسي */}
        <h1 style={mainTitleStyle}>
          طريق الرحمة
        </h1>

        {/* الوصف المخصص */}
        <p style={subtitleStyle}>
          المنصة المتكاملة لحفظ ومراجعة القرآن الكريم بأسلوب تفاعلي، يجمع بين التلاوة التعليمية والتسميع الكتابي والصوتي المباشر.
        </p>

        {/* أزرار العمليات الرئيسية */}
        <div style={ctaGroupStyle}>
          <Link href="/register" style={primaryBtnStyle}>
            <span>ابدأ رحلة الحفظ مجاناً</span>
            <ArrowLeftIcon />
          </Link>

          <Link href="/login" style={secondaryBtnStyle}>
            <span>تسجيل الدخول</span>
          </Link>
        </div>

        {/* شريط الإحصائيات والمميزات السريعة */}
        <div style={statsBarStyle}>
          <div style={statItemStyle}>
            <span style={statNumberStyle}>100%</span>
            <span style={statLabelStyle}>تصحيح فوري ودقيق</span>
          </div>
          <div style={statDividerStyle} />
          <div style={statItemStyle}>
            <span style={statNumberStyle}>114</span>
            <span style={statLabelStyle}>سورة بمختلف القراء</span>
          </div>
          <div style={statDividerStyle} />
          <div style={statItemStyle}>
            <span style={statNumberStyle}>24/7</span>
            <span style={statLabelStyle}>مراجعة وتسميع آلي</span>
          </div>
        </div>

        {/* شبكة المميزات الرئيسية بأيقونات متجهة احترافية */}
        <section style={featuresGridStyle}>

          <div style={cardStyle}>
            <div style={iconBoxStyle}>
              <QuranBookIcon />
            </div>
            <h3 style={cardTitleStyle}>حفظ ومتابعة مخصصة</h3>
            <p style={cardTextStyle}>
              حدد السورة، نطاق الآيات، وعدد مرات التكرار التي تناسب قدرتك مع استماع للتلاوة التعليمية.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconBoxStyle}>
              <AiVoiceMicIcon />
            </div>
            <h3 style={cardTitleStyle}>تقييم صوتي بالذكاء الاصطناعي</h3>
            <p style={cardTextStyle}>
              سجل تلاوتك بصوتك، وسيقوم المحرك الذكي بمطابقة نطقك مع النص القرآني وتحديد الكلمات بدقة.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconBoxStyle}>
              <WriteExamIcon />
            </div>
            <h3 style={cardTitleStyle}>تسميع كتابي ذكي</h3>
            <p style={cardTextStyle}>
              اختبر حفظك عن طريق الكتابة مع تقنية إخفاء الآيات التلقائي لتضمن التسميع الصحيح من الذاكرة.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconBoxStyle}>
              <AnalyticsChartIcon />
            </div>
            <h3 style={cardTitleStyle}>متابعة مستوى الإتقان</h3>
            <p style={cardTextStyle}>
              لوحة قيادة توضح نسبة إتقانك لكل سورة وآية مع حفظ كافة الجلسات لمتابعة تطورك المستمر.
            </p>
          </div>

        </section>

        {/* قسم خطوات العمل (How It Works) */}
        <section style={howItWorksSectionStyle}>
          <h2 style={sectionHeaderTitleStyle}>كيف تبدأ رحلتك؟</h2>

          <div style={stepsGridStyle}>
            <div style={stepCardStyle}>
              <span style={stepBadgeStyle}>01</span>
              <h4 style={stepTitleStyle}>اختر السورة والمدى</h4>
              <p style={stepDescStyle}>حدد السورة والآيات التي ترغب في حفظها أو مراجعتها.</p>
            </div>

            <div style={stepCardStyle}>
              <span style={stepBadgeStyle}>02</span>
              <h4 style={stepTitleStyle}>الاستماع والتكرار</h4>
              <p style={stepDescStyle}>استمع للشيخ المفضل لديك مع التكرار لترسيخ الحفظ.</p>
            </div>

            <div style={stepCardStyle}>
              <span style={stepBadgeStyle}>03</span>
              <h4 style={stepTitleStyle}>التسميع والتقييم</h4>
              <p style={stepDescStyle}>اختبر حفظك صوتياً أو كتابياً واحصل على تقرير الدقة.</p>
            </div>
          </div>
        </section>

        {/* أسفل الصفحة والتوقيع */}
        <footer style={footerStyle}>
          <p style={footerTextStyle}>
            منصة طريق الرحمة — لخدمة وتيسير حفظ القرآن الكريم
          </p>

          {/* توقيع المطور (زياد مصطفى) هادئ وغير ملفت */}
          <div style={developerCreditStyle}>
            Designed & Developed by Ziad Mustafa
          </div>
        </footer>

      </div>
    </main>
  );
}

// ----------------------------------------------------------------
// الأيقونات المتجهة (Vector SVG Icons)
// ----------------------------------------------------------------

function AiSparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function QuranBookIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M6 6h10M6 10h8" />
    </svg>
  );
}

function AiVoiceMicIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function WriteExamIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function AnalyticsChartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

// ----------------------------------------------------------------
// التنسيقات الفاخرة (Ultra-Premium CSS-in-JS)
// ----------------------------------------------------------------

const pageContainerStyle = {
  minHeight: '100vh',
  position: 'relative' as const,
  padding: '3.5rem 1.25rem 2rem',
  background: '#f8fafc',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  overflow: 'hidden',
};

const glowTopStyle = {
  position: 'absolute' as const,
  top: '-120px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '700px',
  height: '450px',
  background: 'radial-gradient(circle, rgba(5, 150, 105, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
  pointerEvents: 'none' as const,
};

const glowBottomStyle = {
  position: 'absolute' as const,
  bottom: '-100px',
  right: '10%',
  width: '500px',
  height: '350px',
  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
  pointerEvents: 'none' as const,
};

const contentWrapperStyle = {
  maxWidth: '1100px',
  width: '100%',
  margin: '0 auto',
  textAlign: 'center' as const,
  zIndex: 1,
};

const heroBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.45rem 1.1rem',
  background: '#ffffff',
  border: '1px solid #a7f3d0',
  borderRadius: '999px',
  color: '#047857',
  fontSize: '0.85rem',
  fontWeight: '700',
  marginBottom: '1.75rem',
  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.05)',
};

const mainTitleStyle = {
  color: '#065f46',
  fontSize: 'clamp(2.8rem, 6.5vw, 4.4rem)',
  fontWeight: '800',
  margin: '0 0 1.2rem 0',
  letterSpacing: '-0.5px',
};

const subtitleStyle = {
  fontSize: 'clamp(1.1rem, 2.2vw, 1.3rem)',
  color: '#475569',
  maxWidth: '700px',
  margin: '0 auto 2.5rem auto',
  lineHeight: '1.8',
  fontWeight: '500',
};

const ctaGroupStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  alignItems: 'center',
  flexWrap: 'wrap' as const,
  marginBottom: '3.5rem',
};

const primaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.6rem',
  fontSize: '1.1rem',
  fontWeight: '700',
  padding: '0.9rem 2.2rem',
  color: '#ffffff',
  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  borderRadius: '12px',
  textDecoration: 'none',
  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.22)',
};

const secondaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '1.1rem',
  fontWeight: '700',
  padding: '0.9rem 2rem',
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  textDecoration: 'none',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
};

const statsBarStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '2rem',
  maxWidth: '750px',
  margin: '0 auto 4rem auto',
  padding: '1.25rem 2rem',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '18px',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
  flexWrap: 'wrap' as const,
};

const statItemStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
};

const statNumberStyle = {
  fontSize: '1.6rem',
  fontWeight: '800',
  color: '#047857',
};

const statLabelStyle = {
  fontSize: '0.8rem',
  color: '#64748b',
  fontWeight: '600',
  marginTop: '0.1rem',
};

const statDividerStyle = {
  width: '1px',
  height: '32px',
  background: '#e2e8f0',
};

const featuresGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1.5rem',
  margin: '0 auto 4.5rem auto',
  textAlign: 'right' as const,
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '1.8rem 1.5rem',
  boxShadow: '0 6px 20px rgba(15, 23, 42, 0.025)',
};

const iconBoxStyle = {
  width: '52px',
  height: '52px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ecfdf5',
  borderRadius: '14px',
  marginBottom: '1.2rem',
  border: '1px solid #a7f3d0',
};

const cardTitleStyle = {
  color: '#065f46',
  fontSize: '1.15rem',
  fontWeight: '700',
  margin: '0 0 0.6rem 0',
};

const cardTextStyle = {
  color: '#64748b',
  fontSize: '0.9rem',
  lineHeight: '1.65',
  margin: 0,
};

const howItWorksSectionStyle = {
  marginBottom: '4.5rem',
  padding: '2.5rem 1.5rem',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '24px',
};

const sectionHeaderTitleStyle = {
  color: '#065f46',
  fontSize: '1.6rem',
  fontWeight: '800',
  marginBottom: '2rem',
};

const stepsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.5rem',
  textAlign: 'right' as const,
};

const stepCardStyle = {
  padding: '1rem',
  position: 'relative' as const,
};

const stepBadgeStyle = {
  display: 'inline-block',
  fontSize: '0.85rem',
  fontWeight: '800',
  color: '#047857',
  background: '#dcfce7',
  padding: '0.2rem 0.6rem',
  borderRadius: '6px',
  marginBottom: '0.75rem',
};

const stepTitleStyle = {
  margin: '0 0 0.4rem 0',
  color: '#0f172a',
  fontSize: '1.05rem',
  fontWeight: '700',
};

const stepDescStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '0.88rem',
  lineHeight: '1.6',
};

const footerStyle = {
  marginTop: 'auto',
  paddingTop: '2rem',
  borderTop: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '0.4rem',
};

const footerTextStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '0.88rem',
  fontWeight: '600',
};

const developerCreditStyle = {
  fontSize: '0.7rem',
  color: '#64748b',
  opacity: 0.35,
  letterSpacing: '0.3px',
  marginTop: '0.2rem',
};