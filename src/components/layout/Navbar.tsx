import './globals.css';
import Navbar from '@/components/Navbar'; // استيراد عادي بدون أقواس {}

export const metadata = {
  title: 'طريق الرحمة',
  description: 'تطبيق متابعة حفظ وتسميع القرآن الكريم',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 text-slate-800 antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}