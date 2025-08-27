'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * PRINSIP ANIMASI PERFORMATIF:
 * 
 * ✅ AMAN untuk dianimasikan (GPU-accelerated):
 * - transform (translate, scale, rotate)
 * - opacity
 * - filter (blur, brightness, etc.)
 * 
 * ❌ HINDARI menganimasikan (menyebabkan layout reflow):
 * - width, height
 * - margin, padding
 * - top, left, right, bottom
 * - border-width
 * - font-size
 */

// ✅ CONTOH YANG BENAR - Menggunakan transform
export const CorrectAnimation = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4">
      <motion.div
        className="w-64 h-32 bg-blue-500 rounded-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        animate={{
          // ✅ Menggunakan scale untuk "mengubah ukuran"
          scale: isExpanded ? 1.2 : 1,
          // ✅ Menggunakan opacity untuk fade effect
          opacity: isExpanded ? 0.8 : 1,
          // ✅ Menggunakan rotate untuk rotasi
          rotate: isExpanded ? 5 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        whileHover={{
          // ✅ Hover effect dengan transform
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
      >
        <div className="p-4 text-white">
          Click to animate (Performant)
        </div>
      </motion.div>
    </div>
  );
};

// ❌ CONTOH YANG SALAH - Menganimasikan layout properties
export const IncorrectAnimation = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4">
      <motion.div
        className="bg-red-500 rounded-lg cursor-pointer text-white p-4"
        onClick={() => setIsExpanded(!isExpanded)}
        animate={{
          // ❌ JANGAN: Menganimasikan width/height menyebabkan reflow
          width: isExpanded ? 300 : 200,
          height: isExpanded ? 150 : 100,
          // ❌ JANGAN: Menganimasikan margin menyebabkan reflow
          marginTop: isExpanded ? 20 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        Avoid this (Causes jank)
      </motion.div>
    </div>
  );
};

// ✅ SOLUSI ALTERNATIF - Simulasi perubahan ukuran dengan transform
export const AlternativeSolution = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4">
      <div className="relative">
        <motion.div
          className="w-64 h-32 bg-green-500 rounded-lg cursor-pointer origin-top-left"
          onClick={() => setIsExpanded(!isExpanded)}
          animate={{
            // ✅ Menggunakan scaleX dan scaleY untuk simulasi perubahan ukuran
            scaleX: isExpanded ? 1.5 : 1,
            scaleY: isExpanded ? 1.2 : 1,
            // ✅ Menggunakan translateY untuk simulasi margin
            translateY: isExpanded ? 20 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          <div className="p-4 text-white">
            Better solution with transform
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ✅ OPTIMIZED CARD COMPONENT
export const OptimizedCard = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={`
        bg-white rounded-xl shadow-sm border p-6 cursor-pointer
        ${className}
      `}
      // ✅ Menggunakan transform untuk hover effect
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { 
          duration: 0.2,
          ease: [0.25, 0.25, 0.25, 0.75]
        }
      }}
      whileTap={{ scale: 0.98 }}
      // ✅ Layout animation untuk perubahan konten
      layout
      layoutId="card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.25, 0.25, 0.75]
      }}
      // ✅ Menggunakan will-change untuk optimasi browser
      style={{
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </motion.div>
  );
};

// ✅ PERFORMANCE MONITORING COMPONENT
export const PerformanceMonitor = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      onAnimationStart={() => {
        // Monitor performance saat animasi dimulai
        if (typeof window !== 'undefined' && 'performance' in window) {
          console.log('Animation started at:', performance.now());
        }
      }}
      onAnimationComplete={() => {
        // Monitor performance saat animasi selesai
        if (typeof window !== 'undefined' && 'performance' in window) {
          console.log('Animation completed at:', performance.now());
        }
      }}
    >
      {children}
    </motion.div>
  );
};
