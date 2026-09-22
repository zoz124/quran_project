
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'لوحة القيادة', href: '/dashboard', icon: '▦' },
        { name: 'التقدم', href: '/progress', icon: '↗' },
        { name: 'السجل', href: '/history', icon: '◷' },
        { name: 'الملف الشخصي', href: '/profile', icon: '○' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#2a4035] bg-[#13221b]/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-[72px] items-center justify-between">

                    {/* Brand */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 group shrink-0"
                    >
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/25 bg-[#1b3025]">
                            <span className="text-[#d4af37] text-lg font-serif">
                                ق
                            </span>
                        </div>

                        <div className="flex flex-col leading-none">
                            <span className="text-[18px] font-bold text-[#f4ead0] font-cairo tracking-tight">
                                طريق الرحمة
                            </span>

                            <span className="mt-1 hidden sm:block text-[10px] text-[#91a49a] font-cairo">
                                منصة حفظ وتسميع القرآن الكريم
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1 rounded-2xl border border-[#263d32] bg-[#172920] p-1.5">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`
                                        relative flex items-center gap-2
                                        rounded-xl px-4 py-2.5
                                        font-cairo text-[13px] font-semibold
                                        transition-all duration-200
                                        ${isActive
                                            ? 'bg-[#263d31] text-[#d4af37] shadow-sm'
                                            : 'text-[#a9b8b0] hover:bg-[#20362b] hover:text-[#e6d49b]'
                                        }
                                    `}
                                >
                                    <span
                                        className={`
                                            flex h-5 w-5 items-center justify-center
                                            text-[14px]
                                            ${isActive
                                                ? 'text-[#d4af37]'
                                                : 'text-[#71857b]'
                                            }
                                        `}
                                    >
                                        {link.icon}
                                    </span>

                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">

                        {/* New Session */}
                        <Link
                            href="/memorize/new"
                            className="
                                hidden sm:flex items-center gap-2
                                rounded-xl
                                bg-[#d4af37]
                                px-4 py-2.5
                                text-[12px] font-bold
                                text-[#14221b]
                                font-cairo
                                shadow-[0_4px_14px_rgba(212,175,55,0.12)]
                                transition-all duration-200
                                hover:bg-[#e1bd4d]
                                hover:shadow-[0_6px_18px_rgba(212,175,55,0.18)]
                            "
                        >
                            <span className="text-base leading-none">+</span>
                            <span>جلسة جديدة</span>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="
                                md:hidden
                                flex h-10 w-10 items-center justify-center
                                rounded-xl
                                border border-[#2a4035]
                                bg-[#1a2c23]
                                text-[#a9b8b0]
                                transition-colors
                                hover:border-[#3a5447]
                                hover:text-[#d4af37]
                                focus:outline-none
                            "
                            aria-label="القائمة"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isMobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.8"
                                        d="M6 6l12 12M18 6L6 18"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.8"
                                        d="M4 7h16M4 12h16M4 17h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div
                className={`
                    md:hidden overflow-hidden
                    border-t border-[#263d32]
                    bg-[#13221b]
                    transition-all duration-200
                    ${isMobileMenuOpen
                        ? 'max-h-[500px] opacity-100'
                        : 'max-h-0 opacity-0'
                    }
                `}
            >
                <div className="px-4 pb-5 pt-3 space-y-1.5">

                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    flex items-center gap-3
                                    rounded-xl px-4 py-3
                                    font-cairo text-sm font-semibold
                                    transition-colors
                                    ${isActive
                                        ? 'bg-[#20362b] text-[#d4af37]'
                                        : 'text-[#a9b8b0] hover:bg-[#1b3026] hover:text-[#e6d49b]'
                                    }
                                `}
                            >
                                <span className="flex h-6 w-6 items-center justify-center text-sm">
                                    {link.icon}
                                </span>

                                <span>{link.name}</span>
                            </Link>
                        );
                    })}

                    {/* Mobile New Session */}
                    <Link
                        href="/memorize/new"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="
                            mt-3 flex w-full items-center justify-center gap-2
                            rounded-xl
                            bg-[#d4af37]
                            py-3
                            text-sm font-bold
                            text-[#14221b]
                            font-cairo
                            transition-colors
                            hover:bg-[#e1bd4d]
                        "
                    >
                        <span className="text-base">+</span>
                        <span>بدء جلسة جديدة</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}

