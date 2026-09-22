import type { Metadata } from 'next';
import '@/app/globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'طريق الرحمة - منصة حفظ وتسميع القرآن الكريم',
  description: 'منصة إسلامية لمتابعة وتسميع وتثبيت القرآن الكريم',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#0e1813] text-slate-100 antialiased font-sans">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}