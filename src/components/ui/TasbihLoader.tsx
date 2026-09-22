'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TasbihLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export default function TasbihLoader({ size = 'md', text = 'جاري التحميل...' }: TasbihLoaderProps) {
    const sizes = {
        sm: { moon: 32, dot: 6 },
        md: { moon: 48, dot: 8 },
        lg: { moon: 64, dot: 10 },
    };

    const { moon, dot } = sizes[size];

    return (
        <div className="flex flex-col items-center justify-center gap-8 py-12">
            {/* Crescent Moon */}
            <motion.div
                className="relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
                <div
                    className="w-16 h-16 rounded-full overflow-hidden"
                    style={{ width: moon, height: moon }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-400 rounded-full" />
                    <div
                        className="absolute bg-slate-900 rounded-full"
                        style={{
                            width: '70%',
                            height: '100%',
                            right: 0,
                        }}
                    />
                </div>
            </motion.div>

            {/* Loading Text */}
            <motion.p
                className="text-emerald-800 font-semibold text-lg"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {text}
            </motion.p>
        </div>
    );
}