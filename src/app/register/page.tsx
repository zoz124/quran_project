'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // إنشاء/تحديث صف في جدول profiles يدويًا لضمان وجود البيانات
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        settings: { tafsirMode: 'On Request' },
      });
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#e8eaea] to-[#c7ccc9] flex items-center justify-center p-4 font-cairo">
      <motion.div
        className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-emerald-100 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white shadow-md mx-auto text-2xl font-bold">
            ✨
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-emerald">
            طريق الرحمة
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            أنشئي حسابكِ للبدء في رحلة الحفظ والتسميع
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            variants={itemVariants}
            className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold text-center"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <motion.div variants={itemVariants} className="space-y-1.5 text-right">
            <label className="block text-sm font-bold text-gray-700">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="أدخلي اسمك الكامل"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-gray-800 text-sm bg-white/90"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1.5 text-right">
            <label className="block text-sm font-bold text-gray-700">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-gray-800 text-sm bg-white/90"
              dir="ltr"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1.5 text-right">
            <label className="block text-sm font-bold text-gray-700">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-gray-800 text-sm bg-white/90"
              dir="ltr"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 text-base font-bold shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  جاري إنشاء الحساب...
                </>
              ) : (
                'إنشاء حساب جديد ➔'
              )}
            </button>
          </motion.div>
        </form>

        {/* Footer Link */}
        <motion.div variants={itemVariants} className="text-center text-sm text-gray-600 font-medium pt-2 border-t border-gray-100">
          لديكِ حساب بالفعل؟{' '}
          <Link href="/login" className="text-[var(--color-primary)] font-bold hover:underline">
            تسجيل الدخول
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}