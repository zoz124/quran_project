'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import TasbihLoader from '@/components/ui/TasbihLoader';

interface Profile {
  id: string;
  name: string;
  email: string;
  settings: any;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tafsirMode, setTafsirMode] = useState('On Request');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const authEmail = session.user.email || '';
      setEmail(authEmail);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
        setName(data.name || '');
        setEmail(data.email || authEmail);
        setTafsirMode(data.settings?.tafsirMode || 'On Request');
      } else {
        const newProfile = {
          id: session.user.id,
          name: session.user.user_metadata?.name || '',
          email: authEmail,
          settings: { tafsirMode: 'On Request' },
        };

        const { data: created } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (created) {
          setProfile(created);
          setName(created.name || '');
        } else {
          setProfile({ id: session.user.id, name: '', email: authEmail, settings: {} });
        }
      }

      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from('profiles').update({
      name,
      settings: { ...profile?.settings, tafsirMode }
    }).eq('id', profile?.id);

    if (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ التغييرات' });
    } else {
      setMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح' });
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9]">
        <TasbihLoader size="lg" text="جاري تحميل الملف الشخصي..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9] p-6 md:p-8">
      <motion.div
        className="relative max-w-2xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shadow-xl">
            <svg className="w-10 h-10 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-cairo font-bold text-gradient-emerald mb-2">
            الملف الشخصي والإعدادات
          </h1>
          <p className="text-[var(--color-text-muted)] font-cairo">
            تحكم في بياناتك وتفضيلاتك الشخصية
          </p>
        </motion.div>

        {/* Success/Error Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 text-center font-cairo font-bold ${message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleSave}
          className="form-container space-y-6"
        >
          <div className="form-group">
            <label className="form-label" style={{ color: '#c7cdca' }}>الاسم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="أدخل اسمك"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#c7cdca' }}>البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              disabled
              className="form-input"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#c7cdca' }}>طريقة عرض التفسير</label>
            <select
              value={tafsirMode}
              onChange={(e) => setTafsirMode(e.target.value)}
              className="form-select"
            >
              <option value="On Request">عند الطلب فقط</option>
              <option value="After Recitation">بعد كل تلاوة</option>
              <option value="Always Visible">دائماً مرئي</option>
            </select>
          </div>

          <motion.button
            type="submit"
            disabled={saving}
            className="btn-gold w-full"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </motion.button>
        </motion.form>

        {/* Logout */}
        <motion.div variants={itemVariants} className="text-center pt-2">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-cairo font-bold border-2 border-red-400/60 text-red-500 bg-white hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            تسجيل الخروج
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}